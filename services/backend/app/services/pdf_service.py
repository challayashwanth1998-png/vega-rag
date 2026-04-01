"""
PDF ingestion service.

Architecture flow:
  1. Upload original PDF bytes → S3 (vegarag-document-storage-challa/<bot_id>/<filename>)
     — serves as audit log and allows re-ingestion without re-upload
  2. Extract text page-by-page using pypdf (pure-Python, no binary deps)
  3. Chunk with RecursiveCharacterTextSplitter (1000 chars, 150 overlap)
  4. Return LangChain Documents → caller embeds via Bedrock Titan → upserts to Pinecone
"""
import io
import boto3
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.core.config import settings


def store_pdf_in_s3(file_bytes: bytes, bot_id: str, filename: str) -> str:
    """
    Stores the raw PDF in S3 under <bucket>/<bot_id>/<filename>.
    Returns the full S3 URI for reference (stored in DynamoDB source record).
    Silently skips if S3_DOCUMENT_BUCKET is not configured (local dev without S3).
    """
    if not settings.S3_DOCUMENT_BUCKET:
        return ""

    s3 = boto3.client("s3", region_name=settings.AWS_REGION)
    key = f"{bot_id}/{filename}"
    s3.put_object(
        Bucket=settings.S3_DOCUMENT_BUCKET,
        Key=key,
        Body=file_bytes,
        ContentType="application/pdf",
    )
    return f"s3://{settings.S3_DOCUMENT_BUCKET}/{key}"


def extract_pdf_to_chunks(file_bytes: bytes, filename: str, chunk_size: int = 1000) -> list[Document]:
    """
    Parses a PDF from raw bytes → extracts text → splits into overlapping chunks.
    Uses pypdf (pure-python, no binary deps) for extraction.
    """
    try:
        from pypdf import PdfReader
    except ImportError as e:
        raise RuntimeError(
            "pypdf is required for PDF ingestion. Add 'pypdf' to requirements.txt and rebuild."
        ) from e

    reader = PdfReader(io.BytesIO(file_bytes))

    full_text_parts: list[str] = []
    for page_num, page in enumerate(reader.pages):
        text = (page.extract_text() or "").strip()
        if text:
            full_text_parts.append(f"[Page {page_num + 1}]\n{text}")

    full_text = "\n\n".join(full_text_parts)

    if not full_text.strip():
        raise ValueError(
            "No readable text found in this PDF — it may be image-only or encrypted. "
            "Try running OCR on it first."
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=150,
        length_function=len,
    )
    chunks = splitter.split_text(full_text)

    return [
        Document(
            page_content=chunk,
            metadata={"source_url": filename, "type": "pdf"},
        )
        for chunk in chunks
    ]
