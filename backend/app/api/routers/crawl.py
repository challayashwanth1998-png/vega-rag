from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import boto3
import os
from datetime import datetime
from app.services.scraper import scrape_url_to_chunks
from app.services.pinecone_service import embed_and_upsert_documents
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

router = APIRouter()

class CrawlRequest(BaseModel):
    url: str
    bot_id: str

class TextRequest(BaseModel):
    title: str
    text_content: str
    bot_id: str

@router.post("/text")
def ingest_text(req: TextRequest):
    """
    Chunks raw text, embeds it using Amazon Titan, and records the status in DynamoDB!
    """
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION'))
    table = dynamodb.Table(os.getenv('DYNAMODB_TABLE_NAME'))
    source_sk = f"SOURCE#TEXT#{req.title}"
    
    # 1. Register Source in DB as "Syncing"
    table.put_item(Item={
        "PK": f"AGENT#{req.bot_id}",
        "SK": source_sk,
        "url": f"Raw Text: {req.title[:15]}...",
        "status": "Syncing...",
        "chunks": 0,
        "createdAt": datetime.utcnow().isoformat()
    })

    try:
        # 2. Text Splitter Processing
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
        chunks = text_splitter.split_text(req.text_content)
        documents = [Document(page_content=chunk, metadata={"source_url": req.title, "type": "raw_text"}) for chunk in chunks]
        
        # 3. Embed & Upsert
        chunks_inserted = embed_and_upsert_documents(documents, req.bot_id)
        
        table.update_item(
            Key={"PK": f"AGENT#{req.bot_id}", "SK": source_sk},
            UpdateExpression="SET #s = :status, chunks = :chunks",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":status": "Synced", ":chunks": chunks_inserted}
        )
        return {"status": "success", "chunks_memorized": chunks_inserted}
    except Exception as e:
        table.update_item(
            Key={"PK": f"AGENT#{req.bot_id}", "SK": source_sk},
            UpdateExpression="SET #s = :status, error_msg = :error",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":status": "Failed", ":error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/crawl")
def crawl_website(req: CrawlRequest):
    """
    Downloads URL, chunks it, embeds it, and explicitly records the status in DynamoDB!
    """
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION'))
    table = dynamodb.Table(os.getenv('DYNAMODB_TABLE_NAME'))
    source_sk = f"SOURCE#{req.url}"
    
    # 1. Register Source in DB as "Syncing"
    table.put_item(Item={
        "PK": f"AGENT#{req.bot_id}",
        "SK": source_sk,
        "url": req.url,
        "status": "Syncing...",
        "chunks": 0,
        "createdAt": datetime.utcnow().isoformat()
    })

    try:
        # 2. Heavy ML Processing
        documents = scrape_url_to_chunks(req.url)
        chunks_inserted = embed_and_upsert_documents(documents, req.bot_id)
        
        # 3. Update DB to Green "Synced" state
        table.update_item(
            Key={"PK": f"AGENT#{req.bot_id}", "SK": source_sk},
            UpdateExpression="SET #s = :status, chunks = :chunks",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":status": "Synced", ":chunks": chunks_inserted}
        )
        
        return {
            "status": "success", 
            "message": f"Successfully scraped {req.url}",
            "chunks_memorized": chunks_inserted
        }
    except Exception as e:
        # 4. If AI fails, record "Failed" in DB so User sees the error in UI
        table.update_item(
            Key={"PK": f"AGENT#{req.bot_id}", "SK": source_sk},
            UpdateExpression="SET #s = :status, error_msg = :error",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":status": "Failed", ":error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))
