"""
Document Tree Index Service — hierarchical TOC tree per document.

At ingestion, segments a document's full text into a tree of sections,
each with a title, summary, and character range. Persists to DynamoDB
alongside the existing chunk+embed pipeline.

At query time, loads the tree for the structural retriever to walk.

DynamoDB schema:
  PK: AGENT#{bot_id}
  SK: TREE#{doc_id}#root          — root node with full tree JSON + full_text
  SK: TREE#{doc_id}#{node_id}     — individual child nodes (for granular queries)

Tree depth is capped at 3 levels to control LLM cost:
  Level 0: Document root (title = document name)
  Level 1: Top-level sections
  Level 2: Subsections within each section
"""
import hashlib
import json
import boto3
from opentelemetry import trace
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field

from app.core.config import settings

tracer = trace.get_tracer(__name__)

MAX_TREE_DEPTH = 3
# DynamoDB item size limit is 400KB; cap text to leave room for metadata
MAX_TEXT_FOR_DYNAMO = 350_000


# ── Pydantic models for LLM structured output ────────────────────────────────

class SectionSegment(BaseModel):
    """A section identified by the LLM within a document."""
    title: str = Field(description="Short descriptive title for this section")
    summary: str = Field(description="One-sentence summary of what this section covers")
    start_phrase: str = Field(
        description="The exact first 6-8 words of this section in the original text"
    )
    end_phrase: str = Field(
        description="The exact last 6-8 words of this section in the original text"
    )


class DocumentSections(BaseModel):
    """Structured output: list of sections found in a document."""
    sections: list[SectionSegment] = Field(
        description="Ordered list of top-level sections in the document"
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_llm(max_tokens: int = 1024):
    return ChatBedrockConverse(
        client=boto3.client("bedrock-runtime", region_name=settings.AWS_REGION),
        model=settings.BEDROCK_CHAT_MODEL,
        max_tokens=max_tokens,
    )


def _get_table():
    dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    return dynamodb.Table(settings.DYNAMODB_TABLE_NAME)


def _doc_id_from_source(source_identifier: str) -> str:
    """Deterministic doc_id from source identifier (e.g., filename or URL)."""
    return hashlib.sha256(source_identifier.encode()).hexdigest()[:16]


def _find_char_range(full_text: str, start_phrase: str, end_phrase: str) -> tuple[int, int]:
    """
    Find the character range of a section using start/end phrases.
    Falls back to (0, len) if phrases can't be located.
    """
    start_idx = full_text.lower().find(start_phrase.lower()[:40])
    if start_idx == -1:
        start_idx = 0

    end_idx = full_text.lower().rfind(end_phrase.lower()[:40])
    if end_idx == -1 or end_idx <= start_idx:
        end_idx = len(full_text)
    else:
        # Include the end phrase itself
        end_idx = min(end_idx + len(end_phrase) + 50, len(full_text))

    return start_idx, end_idx


# ── Tree Building (Ingestion Time) ────────────────────────────────────────────

def _segment_text_into_sections(text: str, level: int = 1) -> list[dict]:
    """
    Uses Nova Micro structured output to identify sections in a text block.
    Returns a list of section dicts with title, summary, and char ranges.
    """
    if level > MAX_TREE_DEPTH or len(text.strip()) < 200:
        return []

    llm = _get_llm(max_tokens=2048).with_structured_output(DocumentSections)
    prompt = (
        "Analyze the following document text and identify its major sections or topics.\n"
        "For each section, provide:\n"
        "- A short descriptive title\n"
        "- A one-sentence summary\n"
        "- The exact first 6-8 words where the section begins\n"
        "- The exact last 6-8 words where the section ends\n\n"
        "Identify between 2 and 8 sections. If the text is too short or "
        "homogeneous for meaningful sections, return an empty list.\n\n"
        f"<text>\n{text[:6000]}\n</text>"
    )

    try:
        result = llm.invoke([
            SystemMessage(content="You are a document structure analyzer. Identify sections precisely."),
            HumanMessage(content=prompt),
        ])
        return [s.model_dump() for s in result.sections]
    except Exception as e:
        print(f"[tree_service] section segmentation failed at level {level}: {e}")
        return []


def build_document_tree(
    full_text: str,
    bot_id: str,
    source_identifier: str,
    doc_title: str = "Document",
) -> dict | None:
    """
    Build a hierarchical table-of-contents tree for a document.

    Called as a background task during ingestion. Segments the document
    into sections (level 1) and optionally subsections (level 2),
    generating titles and summaries with Nova Micro.

    Persists the tree to DynamoDB under TREE# sort keys.

    Returns the root node dict, or None on failure.
    """
    with tracer.start_as_current_span("build_document_tree") as span:
        doc_id = _doc_id_from_source(source_identifier)
        span.set_attribute("tree.doc_id", doc_id)
        span.set_attribute("tree.text_length", len(full_text))

        if len(full_text.strip()) < 200:
            print(f"[tree_service] text too short for tree building ({len(full_text)} chars)")
            return None

        # ── Level 1: Top-level sections ───────────────────────────────────────
        sections = _segment_text_into_sections(full_text, level=1)
        if not sections:
            print(f"[tree_service] no sections found for {source_identifier}")
            return None

        root_node = {
            "node_id": "root",
            "parent_id": None,
            "level": 0,
            "title": doc_title,
            "summary": f"Root document: {doc_title}",
            "char_start": 0,
            "char_end": len(full_text),
            "children": [],
        }

        all_nodes = [root_node]

        for i, section in enumerate(sections):
            char_start, char_end = _find_char_range(
                full_text, section["start_phrase"], section["end_phrase"]
            )
            node_id = f"sec_{i}"
            node = {
                "node_id": node_id,
                "parent_id": "root",
                "level": 1,
                "title": section["title"],
                "summary": section["summary"],
                "char_start": char_start,
                "char_end": char_end,
                "children": [],
            }
            root_node["children"].append(node_id)

            # ── Level 2: Subsections ──────────────────────────────────────────
            section_text = full_text[char_start:char_end]
            if len(section_text) > 500:
                subsections = _segment_text_into_sections(section_text, level=2)
                for j, sub in enumerate(subsections):
                    sub_start, sub_end = _find_char_range(
                        section_text, sub["start_phrase"], sub["end_phrase"]
                    )
                    sub_node_id = f"sec_{i}_sub_{j}"
                    sub_node = {
                        "node_id": sub_node_id,
                        "parent_id": node_id,
                        "level": 2,
                        "title": sub["title"],
                        "summary": sub["summary"],
                        "char_start": char_start + sub_start,
                        "char_end": char_start + sub_end,
                        "children": [],
                    }
                    node["children"].append(sub_node_id)
                    all_nodes.append(sub_node)

            all_nodes.append(node)

        # ── Persist to DynamoDB ───────────────────────────────────────────────
        table = _get_table()
        truncated_text = full_text[:MAX_TEXT_FOR_DYNAMO]

        try:
            # Root node stores the full tree structure + text
            table.put_item(Item={
                "PK": f"AGENT#{bot_id}",
                "SK": f"TREE#{doc_id}#root",
                "doc_id": doc_id,
                "source_identifier": source_identifier,
                "tree_json": json.dumps(all_nodes),
                "full_text": truncated_text,
                "node_count": len(all_nodes),
            })

            # Individual nodes for granular queries
            for node in all_nodes:
                if node["node_id"] == "root":
                    continue
                table.put_item(Item={
                    "PK": f"AGENT#{bot_id}",
                    "SK": f"TREE#{doc_id}#{node['node_id']}",
                    "doc_id": doc_id,
                    "node_id": node["node_id"],
                    "parent_id": node["parent_id"],
                    "level": node["level"],
                    "title": node["title"],
                    "summary": node["summary"],
                    "char_start": node["char_start"],
                    "char_end": node["char_end"],
                    "children": node.get("children", []),
                })

            span.set_attribute("tree.node_count", len(all_nodes))
            print(f"[tree_service] built tree for '{doc_title}': {len(all_nodes)} nodes")
            return root_node

        except Exception as e:
            print(f"[tree_service] DynamoDB persist failed: {e}")
            span.record_exception(e)
            return None


# ── Tree Loading (Query Time) ─────────────────────────────────────────────────

def load_document_trees(bot_id: str) -> list[dict]:
    """
    Load all document trees for a bot from DynamoDB.

    Returns a list of tree dicts, each containing:
      - doc_id, source_identifier
      - nodes: list of node dicts (from tree_json)
      - full_text: the document text for char-range extraction

    Returns empty list if no trees exist (backward-compatible).
    """
    with tracer.start_as_current_span("load_document_trees") as span:
        table = _get_table()
        try:
            response = table.query(
                KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
                FilterExpression="contains(SK, :root_suffix)",
                ExpressionAttributeValues={
                    ":pk": f"AGENT#{bot_id}",
                    ":prefix": "TREE#",
                    ":root_suffix": "#root",
                },
            )
            items = response.get("Items", [])
            span.set_attribute("tree.count", len(items))

            trees = []
            for item in items:
                try:
                    nodes = json.loads(item.get("tree_json", "[]"))
                    trees.append({
                        "doc_id": item.get("doc_id", ""),
                        "source_identifier": item.get("source_identifier", ""),
                        "nodes": nodes,
                        "full_text": item.get("full_text", ""),
                    })
                except (json.JSONDecodeError, KeyError) as e:
                    print(f"[tree_service] failed to parse tree {item.get('SK')}: {e}")
                    continue

            return trees

        except Exception as e:
            print(f"[tree_service] failed to load trees for {bot_id}: {e}")
            span.record_exception(e)
            return []


def has_document_trees(bot_id: str) -> bool:
    """Quick check whether any document trees exist for this bot."""
    with tracer.start_as_current_span("check_trees_exist"):
        table = _get_table()
        try:
            response = table.query(
                KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
                ExpressionAttributeValues={
                    ":pk": f"AGENT#{bot_id}",
                    ":prefix": "TREE#",
                },
                Limit=1,
                Select="COUNT",
            )
            return response.get("Count", 0) > 0
        except Exception:
            return False
