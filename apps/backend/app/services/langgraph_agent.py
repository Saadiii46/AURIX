# pyright: reportMissingImports=false

"""
LangGraph ReAct Agent — server-side tool execution with SSE streaming.
Replaces the manual frontend<->backend tool-call loop in groq_service.py.
"""

import json
import logging
import os
import subprocess
from typing import Any, Generator

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.prebuilt import ToolNode

from app.core.config import OPENROUTER_API_KEY

logger = logging.getLogger(__name__)

AGENT_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free"
DEFAULT_THREAD_ID = "agent-default"

AGENT_SYSTEM_PROMPT = (
    "You are Aurix, an AI assistant with access to tools. "
    "Use tools when needed to answer the user's request. "
    "When you have enough information, provide a clear, concise final answer. "
    "Keep responses short (1-3 sentences) unless the user asks for detail."
)


# ── Tools ────────────────────────────────────────────────────


@tool
def read_file(path: str) -> str:
    """Read contents of a file at the given path."""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read(10_000)
        if len(content) == 10_000:
            content += "\n... [truncated at 10,000 chars]"
        return content
    except FileNotFoundError:
        return f"Error: File not found: {path}"
    except PermissionError:
        return f"Error: Permission denied: {path}"
    except Exception as e:
        return f"Error reading file: {e}"


@tool
def run_command(command: str) -> str:
    """Execute a shell command and return its output."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30,
        )
        output = result.stdout + result.stderr
        if len(output) > 5_000:
            output = output[:5_000] + "\n... [truncated at 5,000 chars]"
        return output if output.strip() else "(no output)"
    except subprocess.TimeoutExpired:
        return "Error: Command timed out after 30 seconds."
    except Exception as e:
        return f"Error running command: {e}"


@tool
async def rag_search(query: str) -> str:
    """Search the knowledge base using semantic search (RAG)."""
    try:
        from app.services.retrieval_service import RetrievalService
        retrieval = RetrievalService()
        results = await retrieval.search(query=query, limit=3)
        if not results.get("results"):
            return "No relevant documents found."
        formatted = []
        for r in results["results"]:
            score = r.get("score", 0)
            text = r.get("text", r.get("payload", {}).get("text", ""))[:500]
            formatted.append(f"[score={score:.2f}] {text}")
        return "\n---\n".join(formatted)
    except Exception as e:
        return f"Error searching knowledge base: {e}"


@tool
def web_search(query: str) -> str:
    """Search the web using DuckDuckGo and return top results."""
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))
        if not results:
            return "No web results found."
        formatted = []
        for r in results:
            title = r.get("title", "")
            body = r.get("body", "")[:200]
            href = r.get("href", "")
            formatted.append(f"**{title}**\n{body}\n{href}")
        return "\n---\n".join(formatted)
    except Exception as e:
        return f"Error searching web: {e}"


# ── Agent Graph ──────────────────────────────────────────────

TOOLS = [read_file, run_command, rag_search, web_search]


def _should_continue(state: MessagesState) -> str:
    """Route: if last message has tool calls -> tools, else -> end."""
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END


class LangGraphAgentManager:
    """ReAct agent with server-side tool execution and SSE streaming."""

    def __init__(self):
        self._llm = ChatOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
            model=AGENT_MODEL,
            temperature=0.3,
            max_tokens=512,
        )
        self._llm_with_tools = self._llm.bind_tools(TOOLS)
        self._checkpointer = MemorySaver()
        self.agent_graph = self._build_graph()

    def _thread_config(self, thread_id: str = DEFAULT_THREAD_ID) -> dict:
        return {"configurable": {"thread_id": thread_id}}

    def _build_graph(self):
        llm = self._llm_with_tools

        def agent_node(state: MessagesState) -> dict:
            messages = state["messages"]
            if not messages or not isinstance(messages[0], SystemMessage):
                messages = [SystemMessage(content=AGENT_SYSTEM_PROMPT)] + list(messages)
            response = llm.invoke(messages)
            return {"messages": [response]}

        tool_node = ToolNode(TOOLS)

        graph = StateGraph(MessagesState)
        graph.add_node("agent", agent_node)
        graph.add_node("tools", tool_node)
        graph.add_edge(START, "agent")
        graph.add_conditional_edges("agent", _should_continue, {"tools": "tools", END: END})
        graph.add_edge("tools", "agent")

        return graph.compile(checkpointer=self._checkpointer)

    # ── SSE Streaming ────────────────────────────────────────

    def stream_agent(
        self, user_message: str, thread_id: str = DEFAULT_THREAD_ID
    ) -> Generator[str, None, None]:
        """Stream agent execution as SSE events.

        Yields SSE-formatted strings:
          event: step     — tool call started
          event: tool_result — tool result preview
          event: text     — final text response
          event: done     — stream finished
          event: error    — error occurred
        """
        config = self._thread_config(thread_id)
        config["recursion_limit"] = 25

        try:
            for update in self.agent_graph.stream(
                {"messages": [HumanMessage(content=user_message)]},
                config=config,
                stream_mode="updates",
            ):
                # update is {node_name: state_diff}
                for node_name, state_diff in update.items():
                    messages = state_diff.get("messages", [])
                    for msg in messages:
                        if isinstance(msg, AIMessage):
                            # Check for tool calls
                            if hasattr(msg, "tool_calls") and msg.tool_calls:
                                for tc in msg.tool_calls:
                                    step_data = {
                                        "tool": tc["name"],
                                        "args": tc["args"],
                                    }
                                    yield f"event: step\ndata: {json.dumps(step_data)}\n\n"
                            # Check for final text content (no tool calls)
                            elif msg.content:
                                text_data = {"text": msg.content}
                                yield f"event: text\ndata: {json.dumps(text_data)}\n\n"

                        elif isinstance(msg, ToolMessage):
                            result_preview = str(msg.content)[:200]
                            result_data = {"result": result_preview}
                            yield f"event: tool_result\ndata: {json.dumps(result_data)}\n\n"

        except Exception as e:
            logger.error("Agent stream error: %s", e, exc_info=True)
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

        yield "event: done\ndata: {}\n\n"

    # ── Non-streaming ────────────────────────────────────────

    def run_agent(
        self, user_message: str, thread_id: str = DEFAULT_THREAD_ID
    ) -> dict:
        """Run agent to completion, return final response."""
        config = self._thread_config(thread_id)
        config["recursion_limit"] = 25

        try:
            result = self.agent_graph.invoke(
                {"messages": [HumanMessage(content=user_message)]},
                config=config,
            )
            last_msg = result["messages"][-1]
            response = last_msg.content if isinstance(last_msg, AIMessage) else "Done."
            return {"response": response}
        except Exception as e:
            logger.error("Agent run error: %s", e, exc_info=True)
            return {"response": f"Agent error: {e}"}

    # ── History ──────────────────────────────────────────────

    def clear_history(self, thread_id: str = DEFAULT_THREAD_ID) -> None:
        config = self._thread_config(thread_id)
        self.agent_graph.update_state(config, {"messages": []})
        logger.info("Agent history cleared for thread: %s", thread_id)

    def get_history(self, thread_id: str = DEFAULT_THREAD_ID) -> list:
        config = self._thread_config(thread_id)
        state = self.agent_graph.get_state(config)
        messages = state.values.get("messages", []) if state.values else []
        result = []
        for m in messages:
            if isinstance(m, SystemMessage):
                role = "system"
            elif isinstance(m, HumanMessage):
                role = "user"
            elif isinstance(m, AIMessage):
                role = "assistant"
            else:
                role = "tool"
            result.append({"role": role, "content": str(m.content)[:500]})
        return result
