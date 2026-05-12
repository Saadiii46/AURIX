# pyright: reportMissingImports=false


import logging
from typing import List, Dict, Any

# LangGraphChatManager replaces direct Groq SDK for all chat operations
from app.services.langgraph_chat import LangGraphChatManager

logger = logging.getLogger(__name__)


class GroqService:
    """Pure chat wrapper — all chat goes through LangGraph.
    Agent mode is handled separately by LangGraphAgentManager."""

    def __init__(self):
        self.chat_manager = LangGraphChatManager(
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=80,
            max_history_length=20,
        )

    # -- Chat — delegated to LangGraph --------------------------------

    def send_message(self, user_message: str) -> dict:
        """Send message via LangGraph chat graph. Returns full response."""
        return self.chat_manager.send_message(user_message)

    def send_message_stream(self, user_message: str):
        """Stream tokens via LangGraph. Used by /chat/stream-tts endpoint."""
        yield from self.chat_manager.send_message_stream(user_message)

    # -- History — delegated to LangGraph -----------------------------

    def clear_history(self) -> None:
        """Clear chat history."""
        self.chat_manager.clear_history()

    def get_history(self) -> List[Dict[str, Any]]:
        """Get history as dicts."""
        return self.chat_manager.get_history()

    def set_system_prompt(self, prompt: str) -> None:
        """Set system prompt in LangGraph state."""
        self.chat_manager.set_system_prompt(prompt)

    def get_config(self) -> dict:
        """Get model config from LangGraph chat manager."""
        return self.chat_manager.get_config()
