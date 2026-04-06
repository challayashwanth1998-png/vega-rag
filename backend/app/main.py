"""
VegaRAG FastAPI application entry point.

Request routing:
  /api/agents/*   — agent CRUD, config, workflow, sources, analytics, activity
  /api/crawl      — URL scraping → Pinecone ingestion
  /api/text       — raw text → Pinecone ingestion
  /api/pdf        — PDF upload → S3 + Pinecone ingestion
  /api/table      — CSV/Excel upload → S3 + DuckDB metadata
  /api/chat       — SSE streaming chat (LangGraph multi-agent router)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routers import crawl, chat, agents, tables, users

app = FastAPI(
    title="VegaRAG API",
    description="Multi-tenant RAG platform — Amazon Bedrock + Pinecone + DynamoDB",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crawl.router, prefix="/api", tags=["ingestion"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(tables.router, prefix="/api", tags=["tables"])
app.include_router(users.router, prefix="/api/agents", tags=["end-users"])


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "message": "VegaRAG API is running", "version": "1.0.0"}
