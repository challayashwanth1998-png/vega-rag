"""
Structural Retriever — LLM-guided tree walking, no embeddings.

Walks the document tree by having Nova Micro score children against
the query at each level, then descending into the best branch(es).
Returns raw text of the top section/leaf node(s).

Emits the standardized retrieval contract:
  {
      "contexts": [...],
      "source": "structural",
      "scores": [...],
      "retrieval_trace": [
          {"node_id": "root", "title": "Document", "action": "expand"},
          {"node_id": "sec_1", "title": "Benefits", "score": 8.5, "action": "select"},
      ]
  }

Fail-safe: If no trees exist or any error occurs, returns empty result.
The caller (graph.py) falls back to vector retrieval.
"""
import boto3
from opentelemetry import trace
from pydantic import BaseModel, Field
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.config import settings
from app.services.tree_service import load_document_trees

tracer = trace.get_tracer(__name__)

# Max sections to return from structural retrieval
MAX_STRUCTURAL_RESULTS = 3


class NodeScore(BaseModel):
    """LLM-scored relevance of a tree node to the query."""
    node_id: str = Field(description="The node_id being scored")
    score: float = Field(description="Relevance score 0-10")
    reason: str = Field(description="Brief reason for the score")


class NodeScores(BaseModel):
    """Structured output: scores for a set of tree nodes."""
    scores: list[NodeScore] = Field(description="Scored nodes, best first")


def _get_llm(max_tokens: int = 512):
    return ChatBedrockConverse(
        client=boto3.client("bedrock-runtime", region_name=settings.AWS_REGION),
        model=settings.BEDROCK_CHAT_MODEL,
        max_tokens=max_tokens,
    )


def _score_nodes(query: str, nodes: list[dict]) -> list[dict]:
    """
    Ask Nova Micro to score a list of tree nodes for relevance to the query.
    Returns nodes sorted by score (descending).
    """
    if not nodes:
        return []

    # Build a concise description of each node for the LLM
    node_descriptions = []
    for node in nodes:
        desc = f"- node_id: {node['node_id']}, title: \"{node['title']}\", summary: \"{node['summary']}\""
        node_descriptions.append(desc)

    descriptions_text = "\n".join(node_descriptions)

    llm = _get_llm(max_tokens=1024).with_structured_output(NodeScores)
    prompt = (
        f"Given the user's query, score each document section for relevance (0-10).\n\n"
        f"Query: \"{query}\"\n\n"
        f"Sections:\n{descriptions_text}\n\n"
        f"Score each section. A score of 8+ means highly relevant, 5-7 somewhat relevant, "
        f"below 5 not relevant. Be selective — most sections should score low."
    )

    try:
        result = llm.invoke([
            SystemMessage(content="You are a precise document section scorer. Score relevance to the query."),
            HumanMessage(content=prompt),
        ])

        # Map scores back to node dicts
        score_map = {s.node_id: (s.score, s.reason) for s in result.scores}
        scored_nodes = []
        for node in nodes:
            score, reason = score_map.get(node["node_id"], (0.0, "not scored"))
            scored_nodes.append({**node, "_score": score, "_reason": reason})

        scored_nodes.sort(key=lambda n: n["_score"], reverse=True)
        return scored_nodes

    except Exception as e:
        print(f"[structural_retriever] node scoring failed: {e}")
        # Fall back to returning all nodes with neutral scores
        return [{**n, "_score": 5.0, "_reason": "scoring failed"} for n in nodes]


def structural_retrieve(query: str, bot_id: str) -> dict:
    """
    Walk document trees by LLM reasoning to find the most relevant sections.

    Returns the standardized retrieval contract:
      {
          "contexts": [str, ...],
          "source": "structural",
          "scores": [float, ...],
          "retrieval_trace": [dict, ...]
      }

    Returns empty contexts if no trees exist or on error.
    """
    with tracer.start_as_current_span("structural_retrieve") as span:
        empty_result = {
            "contexts": [],
            "source": "structural",
            "scores": [],
            "retrieval_trace": [],
        }

        # Load all document trees for this bot
        trees = load_document_trees(bot_id)
        if not trees:
            span.set_attribute("structural.trees_found", 0)
            print(f"[structural_retriever] no trees for bot {bot_id}")
            return empty_result

        span.set_attribute("structural.trees_found", len(trees))

        all_contexts = []
        all_scores = []
        retrieval_trace = []

        for tree_data in trees:
            nodes = tree_data["nodes"]
            full_text = tree_data["full_text"]
            doc_id = tree_data["doc_id"]

            if not nodes or not full_text:
                continue

            # Build node lookup
            node_map = {n["node_id"]: n for n in nodes}
            root = node_map.get("root")
            if not root:
                continue

            retrieval_trace.append({
                "node_id": "root",
                "doc_id": doc_id,
                "title": root.get("title", "Document"),
                "action": "expand",
            })

            # ── Level 1: Score top-level sections ─────────────────────────────
            level1_ids = root.get("children", [])
            level1_nodes = [node_map[nid] for nid in level1_ids if nid in node_map]

            if not level1_nodes:
                continue

            scored_l1 = _score_nodes(query, level1_nodes)

            # Take best scoring sections (score >= 5.0)
            relevant_l1 = [n for n in scored_l1 if n["_score"] >= 5.0]
            if not relevant_l1:
                # If nothing scores well, take the top one anyway
                relevant_l1 = scored_l1[:1]

            for node in relevant_l1[:MAX_STRUCTURAL_RESULTS]:
                retrieval_trace.append({
                    "node_id": node["node_id"],
                    "doc_id": doc_id,
                    "title": node["title"],
                    "score": node["_score"],
                    "action": "descend" if node.get("children") else "select",
                })

                # ── Level 2: If node has children, descend ────────────────────
                children_ids = node.get("children", [])
                child_nodes = [node_map[cid] for cid in children_ids if cid in node_map]

                if child_nodes:
                    scored_l2 = _score_nodes(query, child_nodes)
                    best_child = scored_l2[0] if scored_l2 else None

                    if best_child and best_child["_score"] >= 5.0:
                        # Use the child's narrower range
                        retrieval_trace.append({
                            "node_id": best_child["node_id"],
                            "doc_id": doc_id,
                            "title": best_child["title"],
                            "score": best_child["_score"],
                            "action": "select",
                        })
                        char_start = best_child.get("char_start", 0)
                        char_end = best_child.get("char_end", len(full_text))
                        section_text = full_text[char_start:char_end].strip()
                        all_contexts.append(section_text)
                        all_scores.append(best_child["_score"])
                        continue

                # Use this node's range directly
                char_start = node.get("char_start", 0)
                char_end = node.get("char_end", len(full_text))
                section_text = full_text[char_start:char_end].strip()

                if section_text:
                    all_contexts.append(section_text)
                    all_scores.append(node["_score"])

        span.set_attribute("structural.contexts_found", len(all_contexts))
        print(f"[structural_retriever] found {len(all_contexts)} relevant sections")

        return {
            "contexts": all_contexts[:MAX_STRUCTURAL_RESULTS],
            "source": "structural",
            "scores": all_scores[:MAX_STRUCTURAL_RESULTS],
            "retrieval_trace": retrieval_trace,
        }
