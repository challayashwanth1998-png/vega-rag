"""
Table ingestion router — handles CSV and Excel file uploads.

Data flow:
  1. Multipart upload → S3 archive (s3://<bucket>/<bot_id>/tables/<filename>)
  2. Parse headers + sample rows → store table metadata in DynamoDB
  3. DynamoDB record: AGENT#<bot_id> / TABLE#<filename>
     {filename, table_name, s3_uri, columns, row_count, status}

The sql_service.py reads these records to know which tables exist for SQL queries.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import boto3
import io
import pandas as pd
from datetime import datetime
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter()


def _get_table():
    dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    return dynamodb.Table(settings.DYNAMODB_TABLE_NAME)


def _store_in_s3(file_bytes: bytes, bot_id: str, filename: str) -> str:
    if not settings.S3_DOCUMENT_BUCKET:
        return ""
    s3 = boto3.client("s3", region_name=settings.AWS_REGION)
    key = f"{bot_id}/tables/{filename}"
    s3.put_object(Bucket=settings.S3_DOCUMENT_BUCKET, Key=key, Body=file_bytes)
    return f"s3://{settings.S3_DOCUMENT_BUCKET}/{key}"


def _parse_file(file_bytes: bytes, filename: str) -> pd.DataFrame:
    ext = filename.lower().split(".")[-1]
    if ext == "csv":
        return pd.read_csv(io.BytesIO(file_bytes))
    elif ext in ("xlsx", "xls"):
        return pd.read_excel(io.BytesIO(file_bytes))
    else:
        raise ValueError(f"Unsupported file type: .{ext}")


@router.post("/table")
async def ingest_table(
    bot_id: str = Form(...),
    file: UploadFile = File(...),
):
    """
    Accepts CSV or Excel uploads.
    Stores to S3, parses schema, registers in DynamoDB for SQL querying.
    """
    filename = file.filename or "upload"
    ext = filename.lower().split(".")[-1]
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(status_code=400, detail="Only CSV and Excel (.xlsx, .xls) files are accepted.")

    db_table = _get_table()
    source_sk = f"SOURCE#TABLE#{filename}"
    table_name = filename.rsplit(".", 1)[0].replace("-", "_").replace(" ", "_")

    db_table.put_item(Item={
        "PK": f"AGENT#{bot_id}",
        "SK": source_sk,
        "url": f"Table: {filename}",
        "status": "Syncing...",
        "chunks": 0,
        "createdAt": datetime.utcnow().isoformat(),
    })

    try:
        file_bytes = await file.read()

        # 1. Archive to S3
        s3_uri = _store_in_s3(file_bytes, bot_id, filename)

        # 2. Parse schema
        df = _parse_file(file_bytes, filename)
        columns = list(df.columns)
        row_count = len(df)

        # 3. Register table metadata in DynamoDB (TABLE# key for sql_service)
        db_table.put_item(Item={
            "PK": f"AGENT#{bot_id}",
            "SK": f"TABLE#{filename}",
            "filename": filename,
            "table_name": table_name,
            "s3_uri": s3_uri,
            "columns": columns,
            "row_count": row_count,
            "createdAt": datetime.utcnow().isoformat(),
        })

        # 4. Update source status to Synced
        db_table.update_item(
            Key={"PK": f"AGENT#{bot_id}", "SK": source_sk},
            UpdateExpression="SET #s = :status, chunks = :chunks",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":status": "Synced", ":chunks": row_count},
        )

        return {
            "status": "success",
            "filename": filename,
            "table_name": table_name,
            "columns": columns,
            "row_count": row_count,
            "s3_uri": s3_uri,
        }

    except Exception as e:
        db_table.update_item(
            Key={"PK": f"AGENT#{bot_id}", "SK": source_sk},
            UpdateExpression="SET #s = :status, error_msg = :error",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":status": "Failed", ":error": str(e)},
        )
        raise HTTPException(status_code=500, detail=str(e))

class SchemaUpdateReq(BaseModel):
    schema_explanations: dict[str, str]

@router.get("/{bot_id}/tables/{filename}")
def get_table_details(bot_id: str, filename: str):
    """Fetches full table metadata including schema_explanations."""
    db_table = _get_table()
    resp = db_table.get_item(Key={"PK": f"AGENT#{bot_id}", "SK": f"TABLE#{filename}"})
    if "Item" not in resp:
        raise HTTPException(status_code=404, detail="Table not found.")
    return resp["Item"]

@router.put("/{bot_id}/tables/{filename}/schema")
def update_table_schema(bot_id: str, filename: str, req: SchemaUpdateReq):
    """Updates the data dictionary context for a particular table."""
    db_table = _get_table()
    try:
        db_table.update_item(
            Key={"PK": f"AGENT#{bot_id}", "SK": f"TABLE#{filename}"},
            UpdateExpression="SET schema_explanations = :s",
            ExpressionAttributeValues={":s": req.schema_explanations}
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
