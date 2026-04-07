"""
Ingestion router — URL crawl, raw text, and PDF upload.

Data flow for each source type:
  URL:  HTTP scrape → BS4 parse → chunk → Bedrock Titan embed → Pinecone upsert → DynamoDB status
  Text: raw paste → chunk → Bedrock Titan embed → Pinecone upsert → DynamoDB status
  PDF:  upload → S3 archive → pypdf extract → chunk → Bedrock Titan embed → Pinecone upsert → DynamoDB status
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import boto3
from datetime import datetime

from app.core.config import settings
from app.schemas.models import CrawlRequest, TextRequest
from app.services.scraper import scrape_url_to_chunks
from app.services.pinecone_service import embed_and_upsert_documents
from app.services.pdf_service import extract_pdf_to_chunks, store_pdf_in_s3
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

router = APIRouter()


def _get_table():
    dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    return dynamodb.Table(settings.DYNAMODB_TABLE_NAME)


def _mark_syncing(table, bot_id: str, source_sk: str, display_url: str):
    table.put_item(Item={
        "PK": f"AGENT#{bot_id}",
        "SK": source_sk,
        "url": display_url,
        "status": "Syncing...",
        "chunks": 0,
        "createdAt": datetime.utcnow().isoformat(),
    })


def _mark_synced(table, bot_id: str, source_sk: str, chunks: int, s3_uri: str = ""):
    update_expr = "SET #s = :status, chunks = :chunks"
    attr_values = {":status": "Synced", ":chunks": chunks}
    if s3_uri:
        update_expr += ", s3_uri = :s3"
        attr_values[":s3"] = s3_uri
    table.update_item(
        Key={"PK": f"AGENT#{bot_id}", "SK": source_sk},
        UpdateExpression=update_expr,
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues=attr_values,
    )


def _mark_failed(table, bot_id: str, source_sk: str, error: str):
    table.update_item(
        Key={"PK": f"AGENT#{bot_id}", "SK": source_sk},
        UpdateExpression="SET #s = :status, error_msg = :error",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":status": "Failed", ":error": error},
    )


# ── URL Crawl ─────────────────────────────────────────────────────────────────

@router.post("/crawl")
def crawl_website(req: CrawlRequest):
    """Scrapes a URL, chunks, embeds via Bedrock Titan + Contextual Retrieval, upserts to Pinecone."""
    table = _get_table()
    source_sk = f"SOURCE#{req.url}"
    _mark_syncing(table, req.bot_id, source_sk, req.url)
    try:
        documents = scrape_url_to_chunks(req.url)
        full_text = "\n\n".join(d.page_content for d in documents)
        chunks_inserted = embed_and_upsert_documents(documents, req.bot_id, full_text=full_text)
        _mark_synced(table, req.bot_id, source_sk, chunks_inserted)
        return {"status": "success", "chunks_memorized": chunks_inserted}
    except Exception as e:
        _mark_failed(table, req.bot_id, source_sk, str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ── Raw Text ──────────────────────────────────────────────────────────────────

@router.post("/text")
def ingest_text(req: TextRequest):
    """Chunks raw pasted text, embeds via Bedrock Titan + Contextual Retrieval, upserts to Pinecone."""
    table = _get_table()
    source_sk = f"SOURCE#TEXT#{req.title}"
    _mark_syncing(table, req.bot_id, source_sk, f"Raw Text: {req.title[:15]}...")
    try:
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
        chunks = splitter.split_text(req.text_content)
        documents = [
            Document(page_content=c, metadata={"source_url": req.title, "type": "raw_text"})
            for c in chunks
        ]
        chunks_inserted = embed_and_upsert_documents(documents, req.bot_id, full_text=req.text_content)
        _mark_synced(table, req.bot_id, source_sk, chunks_inserted)
        return {"status": "success", "chunks_memorized": chunks_inserted}
    except Exception as e:
        _mark_failed(table, req.bot_id, source_sk, str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ── PDF Upload ────────────────────────────────────────────────────────────────

@router.post("/pdf")
async def ingest_pdf(
    bot_id: str = Form(...),
    file: UploadFile = File(...),
):
    """
    Full PDF pipeline:
      1. Read multipart bytes
      2. Archive to S3 (s3://vegarag-document-storage-challa/<bot_id>/<filename>)
      3. Extract text via pypdf
      4. Chunk → Bedrock Titan embed → Pinecone upsert (namespace=bot_id)
      5. Record status + S3 URI in DynamoDB
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    table = _get_table()
    source_sk = f"SOURCE#PDF#{file.filename}"
    _mark_syncing(table, bot_id, source_sk, f"PDF: {file.filename}")

    try:
        file_bytes = await file.read()

        # Step 1: Archive to S3 for audit / re-ingestion without re-upload
        s3_uri = store_pdf_in_s3(file_bytes, bot_id, file.filename)

        # Step 2: Extract → chunk (returns documents + full_text for contextual retrieval)
        documents, full_text = extract_pdf_to_chunks(file_bytes, file.filename)

        # Step 3: Contextual Retrieval embed → Pinecone upsert
        # Each chunk gets an LLM-generated context prepended before embedding
        # so vectors carry full document awareness (Anthropic, 2024)
        chunks_inserted = embed_and_upsert_documents(documents, bot_id, full_text=full_text)

        # Step 4: Mark synced + store S3 reference
        _mark_synced(table, bot_id, source_sk, chunks_inserted, s3_uri)

        return {
            "status": "success",
            "filename": file.filename,
            "s3_uri": s3_uri,
            "chunks_memorized": chunks_inserted,
        }

    except ValueError as e:
        # User-facing error (image-only PDF, encrypted, etc.)
        _mark_failed(table, bot_id, source_sk, str(e))
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        _mark_failed(table, bot_id, source_sk, str(e))
        raise HTTPException(status_code=500, detail=str(e))
