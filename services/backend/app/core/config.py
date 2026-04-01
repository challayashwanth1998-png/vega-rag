"""
Central application config — single source of truth for all env vars.

Local dev:  reads from backend/.env via python-dotenv
Production: ECS Fargate injects these as Task Definition environment variables
            (set via AWS Console, CDK, or Secrets Manager — never baked into the image)
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── AWS Core ───────────────────────────────────────────────────────────────
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")

    # ── DynamoDB ───────────────────────────────────────────────────────────────
    # Single-table design: PlatformDB holds agents, sources, activity, stats, config
    DYNAMODB_TABLE_NAME: str = os.getenv("DYNAMODB_TABLE_NAME", "PlatformDB")

    # ── S3 ─────────────────────────────────────────────────────────────────────
    # Original documents (PDFs, etc.) are stored here for audit / re-ingestion
    S3_DOCUMENT_BUCKET: str = os.getenv("S3_DOCUMENT_BUCKET", "")

    # ── Pinecone ───────────────────────────────────────────────────────────────
    # Vectors are namespaced per bot_id for hard multi-tenant isolation
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "vega-rag-index")
    PINECONE_HOST: str = os.getenv("PINECONE_HOST", "")

    # ── Bedrock ────────────────────────────────────────────────────────────────
    # Embeddings: Amazon Titan Embed Text v2
    # Generation: Amazon Nova Micro (fast, cheap)
    BEDROCK_EMBED_MODEL: str = "amazon.titan-embed-text-v2:0"
    BEDROCK_CHAT_MODEL: str = "amazon.nova-micro-v1:0"

    # ── Cognito ────────────────────────────────────────────────────────────────
    COGNITO_USER_POOL_ID: str = os.getenv("COGNITO_USER_POOL_ID", "")
    COGNITO_APP_CLIENT_ID: str = os.getenv("COGNITO_APP_CLIENT_ID", "")

    # ── CORS ───────────────────────────────────────────────────────────────────
    # Production: lock this to your ALB / CloudFront domain
    ALLOWED_ORIGINS: list[str] = os.getenv("ALLOWED_ORIGINS", "*").split(",")


settings = Settings()
