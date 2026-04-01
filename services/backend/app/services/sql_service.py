"""
SQL service — Text-to-SQL over uploaded CSV/Excel files using DuckDB.

Architecture:
  1. User uploads CSV/Excel → stored in S3 as s3://<bucket>/<bot_id>/tables/<filename>
  2. Table metadata (schema, columns, S3 path) → stored in DynamoDB
  3. sql_node in LangGraph calls execute_sql_for_bot():
     a. Lists available tables from DynamoDB for this bot
     b. Downloads files from S3 into a temp DuckDB in-process DB
     c. LLM generates SQL via Text-to-SQL prompt
     d. DuckDB executes SQL → returns result as formatted string

DuckDB is chosen because:
  - Pure Python, no server needed, reads CSV/Parquet/Excel directly
  - Industry standard for in-process analytical queries (used by MotherDuck, etc.)
  - Can query S3 files directly with httpfs extension in production
"""
import io
import os
import json
import boto3
import tempfile
import duckdb
import pandas as pd
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings


def _get_llm():
    return ChatBedrockConverse(
        client=boto3.client("bedrock-runtime", region_name=settings.AWS_REGION),
        model=settings.BEDROCK_CHAT_MODEL,
    )


def _get_table():
    dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    return dynamodb.Table(settings.DYNAMODB_TABLE_NAME)


def get_bot_tables(bot_id: str) -> list[dict]:
    """Returns all CSV/Excel table metadata registered for this bot."""
    table = _get_table()
    response = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues={
            ":pk": f"AGENT#{bot_id}",
            ":prefix": "TABLE#",
        },
    )
    return response.get("Items", [])


def _download_from_s3(s3_uri: str) -> bytes:
    """Downloads a file from S3 URI and returns raw bytes."""
    # s3://bucket/key
    without_prefix = s3_uri[5:]  # strip "s3://"
    bucket, key = without_prefix.split("/", 1)
    s3 = boto3.client("s3", region_name=settings.AWS_REGION)
    response = s3.get_object(Bucket=bucket, Key=key)
    return response["Body"].read()


def _load_table_to_duckdb(conn: duckdb.DuckDBPyConnection, table_info: dict) -> str:
    """
    Loads a CSV or Excel file into DuckDB as a named table.
    Returns the table name used.
    """
    filename = table_info["filename"]
    s3_uri = table_info.get("s3_uri", "")
    table_name = table_info.get("table_name", filename.replace(".", "_").replace("-", "_").replace(" ", "_"))

    file_bytes = _download_from_s3(s3_uri) if s3_uri else b""
    if not file_bytes:
        return table_name

    ext = filename.lower().split(".")[-1]
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        if ext == "csv":
            conn.execute(f"CREATE TABLE IF NOT EXISTS \"{table_name}\" AS SELECT * FROM read_csv_auto('{tmp_path}')")
        elif ext in ("xlsx", "xls"):
            df = pd.read_excel(tmp_path)
            conn.register(table_name, df)
    finally:
        os.unlink(tmp_path)

    return table_name


def _build_schema_string(conn: duckdb.DuckDBPyConnection, table_names: list[str]) -> str:
    """Generates a schema description string for the LLM Text-to-SQL prompt."""
    parts = []
    for tname in table_names:
        try:
            cols = conn.execute(f'DESCRIBE "{tname}"').fetchall()
            col_defs = ", ".join(f"{c[0]} ({c[1]})" for c in cols)
            # Sample 3 rows to help LLM understand the data
            sample = conn.execute(f'SELECT * FROM "{tname}" LIMIT 3').fetchdf()
            parts.append(f'Table: "{tname}"\nColumns: {col_defs}\nSample:\n{sample.to_string(index=False)}')
        except Exception as e:
            parts.append(f'Table: "{tname}" (schema unavailable: {e})')
    return "\n\n".join(parts)


def execute_sql_for_bot(bot_id: str, user_query: str) -> str:
    """
    Full Text-to-SQL pipeline for a given bot and user question.
    Returns the formatted query result as a string.
    """
    tables = get_bot_tables(bot_id)

    if not tables:
        return "No CSV or Excel files have been uploaded to this agent yet. Please upload data files first."

    conn = duckdb.connect(":memory:")
    loaded_tables = []

    for t in tables:
        try:
            tname = _load_table_to_duckdb(conn, t)
            loaded_tables.append(tname)
        except Exception as e:
            print(f"[sql_service] Failed to load table {t.get('filename')}: {e}")

    if not loaded_tables:
        return "Could not load any data files. Please check that your uploads completed successfully."

    schema_str = _build_schema_string(conn, loaded_tables)

    # Text-to-SQL: generate query
    llm = _get_llm()
    sql_resp = llm.invoke([
        SystemMessage(content=f"""You are an expert SQL analyst using DuckDB syntax.
Given the following table schemas and a user question, generate a valid DuckDB SQL query.
Return ONLY the SQL query, no explanation, no markdown code blocks.

{schema_str}"""),
        HumanMessage(content=user_query)
    ])

    sql_query = sql_resp.content.strip() if isinstance(sql_resp.content, str) else ""
    # Strip markdown code blocks if LLM included them anyway
    sql_query = sql_query.replace("```sql", "").replace("```", "").strip()

    print(f"[sql_service] generated SQL: {sql_query}")

    try:
        result_df = conn.execute(sql_query).fetchdf()
        conn.close()
        if result_df.empty:
            return "The query returned no results."
        return result_df.to_string(index=False)
    except Exception as e:
        conn.close()
        return f"SQL execution error: {e}\nGenerated query was: {sql_query}"
