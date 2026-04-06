"""
Pydantic schemas (request & response models).
Keeping these separate from routers makes them reusable and testable.
"""
from pydantic import BaseModel
from typing import Optional


# ── Agents ───────────────────────────────────────────────────────────────────

class CreateAgentReq(BaseModel):
    name: str
    user_email: str


class UpdateConfigReq(BaseModel):
    system_prompt: str
    brand_color: str = "#2563eb"
    name: str = "My Custom Agent"
    welcome_message: str = "Hi! How can I assist you today?"
    chat_title: str = ""
    chat_logo_url: str = ""


class WorkflowReq(BaseModel):
    nodes: list
    edges: list


# ── Ingestion ─────────────────────────────────────────────────────────────────

class CrawlRequest(BaseModel):
    url: str
    bot_id: str


class TextRequest(BaseModel):
    title: str
    text_content: str
    bot_id: str


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str
    bot_id: str
    session_id: str = "default_session"
    user_email: Optional[str] = None          # set by authenticated widget sessions
    restricted_tables: Optional[list] = None  # override from caller; backend fetches from DB if not set
