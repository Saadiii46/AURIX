# pyright: reportMissingImports=false

"""
LangGraph Chat Manager — uses StateGraph with built-in checkpointer memory.
Replaces manual array-based history with LangGraph's MemorySaver.
"""

import logging
from typing import List, Dict, Any

from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.checkpoint.memory import MemorySaver

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.core.config import GROQ_API_KEY

logger = logging.getLogger(__name__)

DEFAULT_SYSTEM_PROMPT = (
    "You are a voice assistant. STRICT RULE: Reply in 1-2 sentences ONLY. "
    "Never exceed 30 words. No lists, no bullet points, no elaboration. "
    "Be casual and direct like a quick chat with a friend."
)

MAX_HISTORY_LENGTH = 20
DEFAULT_THREAD_ID = "default"


class LangGraphChatManager:
    """Owns the chat graph with checkpointer-based memory.
    GroqService delegates all chat + history calls here."""

    def __init__(
        self,
        model: str = "llama-3.1-8b-instant",
        temperature: float = 0.7,
        max_tokens: int = 80,
        max_history_length: int = MAX_HISTORY_LENGTH,
    ):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.max_history_length = max_history_length
        self.system_prompt = DEFAULT_SYSTEM_PROMPT

        self._llm = ChatGroq(
            api_key=GROQ_API_KEY,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        self._stream_llm = ChatGroq(
            api_key=GROQ_API_KEY,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            streaming=True,
        )

        self._checkpointer = MemorySaver()
        self.chat_graph = self._build_chat_graph()

    def _thread_config(self, thread_id: str = DEFAULT_THREAD_ID) -> dict:
        return {"configurable": {"thread_id": thread_id}}

    def _build_chat_graph(self):
        """Build graph: START -> chat_node -> END with checkpointer memory."""
        llm = self._llm
        manager = self

        def chat_node(state: MessagesState) -> dict:
            messages = state["messages"]
            # prepend system prompt if not already present
            if not messages or not isinstance(messages[0], SystemMessage):
                messages = [SystemMessage(content=manager.system_prompt)] + list(messages)
            # trim to max history length
            if len(messages) > manager.max_history_length:
                messages = [messages[0]] + messages[-(manager.max_history_length - 1):]
            result = llm.invoke(messages)
            return {"messages": [result]}

        graph = StateGraph(MessagesState)
        graph.add_node("chat", chat_node)
        graph.add_edge(START, "chat")
        graph.add_edge("chat", END)

        return graph.compile(checkpointer=self._checkpointer)

    # -- Chat --------------------------------------------------------

    def send_message(self, user_message: str, thread_id: str = DEFAULT_THREAD_ID) -> dict:
        """Add user message, run graph, return AI response."""
        logger.info("User message: %s", user_message)
        config = self._thread_config(thread_id)

        try:
            result = self.chat_graph.invoke(
                {"messages": [HumanMessage(content=user_message)]},
                config=config,
            )

            # last message in state is the AI response
            ai_message = result["messages"][-1]
            assistant_content = (
                ai_message.content
                if isinstance(ai_message, AIMessage)
                else "I apologize, but I could not generate a response."
            )

            logger.info("Assistant response: %s", assistant_content)

            return {
                "message": assistant_content,
                "role": "assistant",
                "usage": None,
            }

        except Exception as e:
            if "context_length_exceeded" in str(e):
                logger.warning("Context length exceeded, clearing history and retrying")
                self.clear_history(thread_id)
                return self.send_message(user_message, thread_id)

            status = getattr(e, "status_code", None) or getattr(e, "status", None)
            if status == 401:
                raise Exception("Invalid Groq API key. Please check your configuration.")
            elif status == 429:
                raise Exception("Groq API rate limit exceeded. Please try again in a moment.")
            elif status == 400:
                raise Exception(f"Invalid request: {str(e)}")

            raise Exception(f"Chat error: {str(e)}")

    def send_message_stream(self, user_message: str, thread_id: str = DEFAULT_THREAD_ID):
        """Stream tokens one by one. Reads/writes history through checkpointer."""
        logger.info("User message (stream): %s", user_message)
        config = self._thread_config(thread_id)

        # get current history from checkpointer
        state = self.chat_graph.get_state(config)
        messages = list(state.values.get("messages", [])) if state.values else []

        # prepend system prompt if needed
        if not messages or not isinstance(messages[0], SystemMessage):
            messages = [SystemMessage(content=self.system_prompt)] + messages

        # add user message
        messages.append(HumanMessage(content=user_message))

        # trim
        if len(messages) > self.max_history_length:
            messages = [messages[0]] + messages[-(self.max_history_length - 1):]

        try:
            full_response = ""
            for chunk in self._stream_llm.stream(messages):
                if chunk.content:
                    full_response += chunk.content
                    yield chunk.content

            if not full_response:
                full_response = "I apologize, but I could not generate a response."

            # save updated history (user + assistant) through the graph
            # update_state adds messages to the checkpointed state
            self.chat_graph.update_state(
                config,
                {"messages": [
                    HumanMessage(content=user_message),
                    AIMessage(content=full_response),
                ]},
            )
            logger.info("Streaming response complete, length: %d", len(full_response))

        except Exception as e:
            if "context_length_exceeded" in str(e):
                logger.warning("Context length exceeded during stream, clearing history")
                self.clear_history(thread_id)
                yield from self.send_message_stream(user_message, thread_id)
                return

            raise Exception(f"Chat stream error: {str(e)}")

    # -- History Management ------------------------------------------

    def clear_history(self, thread_id: str = DEFAULT_THREAD_ID) -> None:
        """Clear conversation by updating state with empty messages."""
        config = self._thread_config(thread_id)
        # overwrite state with just the system prompt
        self.chat_graph.update_state(
            config,
            {"messages": []},
        )
        logger.info("Conversation history cleared for thread: %s", thread_id)

    def get_history(self, thread_id: str = DEFAULT_THREAD_ID) -> List[Dict[str, Any]]:
        """Read messages from checkpointer and convert to dicts for API responses."""
        config = self._thread_config(thread_id)
        state = self.chat_graph.get_state(config)
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
                role = "unknown"
            result.append({"role": role, "content": m.content})
        return result

    def set_system_prompt(self, prompt: str) -> None:
        """Update the system prompt used for future messages."""
        self.system_prompt = prompt
        logger.info("System prompt updated")

    def get_config(self) -> dict:
        """Return current model config and system prompt."""
        return {
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "max_history_length": self.max_history_length,
            "system_prompt": self.system_prompt,
        }
