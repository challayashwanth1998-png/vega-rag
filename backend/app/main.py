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
from app.core.logger import setup_logging
from app.api.routers import crawl, chat, agents, tables, users
from asgi_correlation_id import CorrelationIdMiddleware
import structlog
from app.core.tracer import setup_tracing
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.botocore import BotocoreInstrumentor

# Setup structlog (use json_logs=True in production)
setup_logging(json_logs=True)
logger = structlog.get_logger("vega.main")

# Initialize OpenTelemetry Tracer & Auto-Instrument boto3
setup_tracing()
BotocoreInstrumentor().instrument()

app = FastAPI(
    title="VegaRAG API",
    description="Multi-tenant RAG platform — Amazon Bedrock + Pinecone + DynamoDB",
    version="1.0.0",
)

# Middleware to generate/track X-Request-ID (trace_id)
app.add_middleware(CorrelationIdMiddleware)

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

# Instrument the FastAPI app for OpenTelemetry
FastAPIInstrumentor.instrument_app(app)


@app.get("/", tags=["health"])
def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok", "message": "VegaRAG API is running", "version": "1.0.0"}

