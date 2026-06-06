"""
Integration test — runs one query through each retrieval mode.

Verifies the output contract shape and that context is populated
for each mode (vector, structural, hybrid) with fully mocked
LLM and Pinecone backends.
"""
import pytest
from unittest.mock import patch, MagicMock
import json


# ── Shared mock fixtures ──────────────────────────────────────────────────────

MOCK_TREE_NODES = [
    {
        "node_id": "root",
        "parent_id": None,
        "level": 0,
        "title": "Test Document",
        "summary": "A test document about company benefits",
        "char_start": 0,
        "char_end": 300,
        "children": ["sec_0", "sec_1"],
    },
    {
        "node_id": "sec_0",
        "parent_id": "root",
        "level": 1,
        "title": "Health Benefits",
        "summary": "Details about health insurance plans",
        "char_start": 0,
        "char_end": 150,
        "children": [],
    },
    {
        "node_id": "sec_1",
        "parent_id": "root",
        "level": 1,
        "title": "Retirement Plans",
        "summary": "401k and pension details",
        "char_start": 150,
        "char_end": 300,
        "children": [],
    },
]

MOCK_FULL_TEXT = (
    "Our company offers comprehensive health insurance plans including dental, "
    "vision, and medical coverage. Employees can choose from PPO, HMO, and HDHP options. "
    "We also provide retirement benefits through a 401k plan with company matching up to 6%. "
    "Additionally, pension plans are available for employees with 10+ years of service."
)


def _mock_pinecone_results():
    return {
        "matches": [
            {"id": "c1", "score": 0.92, "metadata": {"text": "Health insurance includes dental and vision."}},
            {"id": "c2", "score": 0.87, "metadata": {"text": "401k matching up to 6% of salary."}},
            {"id": "c3", "score": 0.83, "metadata": {"text": "PPO and HMO options available."}},
        ]
    }


class TestVectorModeIntegration:
    """End-to-end test of vector retrieval mode through the graph node."""

    @patch("app.services.pinecone_service.reciprocal_rank_fusion")
    @patch("app.services.pinecone_service.bm25_score")
    @patch("app.services.pinecone_service.index")
    @patch("app.services.pinecone_service.embeddings")
    def test_vector_retriever_output_contract(
        self, mock_embeddings, mock_index, mock_bm25, mock_rrf
    ):
        from app.agent.graph import vector_retriever_node

        mock_embeddings.embed_query.return_value = [0.0] * 1024
        mock_index.query.return_value = _mock_pinecone_results()
        mock_bm25.return_value = 1.0
        mock_rrf.return_value = [
            ({"id": "c1", "metadata": {"text": "Health insurance includes dental."}}, 0.03),
            ({"id": "c2", "metadata": {"text": "401k matching up to 6%."}}, 0.02),
        ]

        state = {
            "bot_id": "bot_test",
            "query": "what health benefits do you offer?",
            "intent": "rag",
            "context": "",
            "sql_result": "",
            "restricted_tables": [],
            "retrieval_mode": "vector",
            "retrieval_strategy": "vector",
            "retrieval_trace": [],
            "retrieval_source": "",
            "retrieval_quality": 0.0,
        }

        result = vector_retriever_node(state)

        assert result["context"] != ""
        assert result["retrieval_source"] == "vector"
        assert isinstance(result["retrieval_trace"], list)
        assert result["sql_result"] == ""


class TestStructuralModeIntegration:
    """End-to-end test of structural retrieval mode through the graph node."""

    @patch("app.services.structural_retriever.load_document_trees")
    @patch("app.services.structural_retriever._score_nodes")
    def test_structural_retriever_output_contract(self, mock_score, mock_load):
        from app.agent.graph import structural_retriever_node

        mock_load.return_value = [{
            "doc_id": "abc123",
            "source_identifier": "test.pdf",
            "nodes": MOCK_TREE_NODES,
            "full_text": MOCK_FULL_TEXT,
        }]

        # First call: score level-1 sections
        mock_score.return_value = [
            {**MOCK_TREE_NODES[1], "_score": 9.0, "_reason": "very relevant"},
            {**MOCK_TREE_NODES[2], "_score": 3.0, "_reason": "not relevant"},
        ]

        state = {
            "bot_id": "bot_test",
            "query": "what health benefits do you offer?",
            "intent": "rag",
            "context": "",
            "sql_result": "",
            "restricted_tables": [],
            "retrieval_mode": "structural",
            "retrieval_strategy": "structural",
            "retrieval_trace": [],
            "retrieval_source": "",
            "retrieval_quality": 0.0,
        }

        result = structural_retriever_node(state)

        assert result["context"] != ""
        assert result["retrieval_source"] == "structural"
        assert isinstance(result["retrieval_trace"], list)
        assert len(result["retrieval_trace"]) > 0  # Should have trace entries


class TestHybridModeIntegration:
    """End-to-end test of hybrid retrieval mode through the graph node."""

    @patch("app.services.hybrid_retriever._rerank")
    @patch("app.services.hybrid_retriever.structural_retrieve")
    @patch("app.services.hybrid_retriever._vector_retrieve")
    def test_hybrid_retriever_output_contract(self, mock_vector, mock_structural, mock_rerank):
        from app.agent.graph import hybrid_retriever_node

        mock_vector.return_value = {
            "contexts": ["Vector chunk about health insurance."],
            "source": "vector",
            "scores": [0.92],
            "retrieval_trace": [],
        }
        mock_structural.return_value = {
            "contexts": ["Structural section about benefits."],
            "source": "structural",
            "scores": [8.5],
            "retrieval_trace": [{"node_id": "sec_0", "action": "select"}],
        }

        # Rerank just returns passages as-is
        mock_rerank.side_effect = lambda q, passages: passages

        state = {
            "bot_id": "bot_test",
            "query": "what health benefits do you offer?",
            "intent": "rag",
            "context": "",
            "sql_result": "",
            "restricted_tables": [],
            "retrieval_mode": "hybrid",
            "retrieval_strategy": "hybrid",
            "retrieval_trace": [],
            "retrieval_source": "",
            "retrieval_quality": 0.0,
        }

        result = hybrid_retriever_node(state)

        assert result["context"] != ""
        assert result["retrieval_source"] == "hybrid"
        assert isinstance(result["retrieval_trace"], list)
        # Should have merged contexts from both sources
        assert "---" in result["context"]  # Separator between chunks


class TestRetrievalRouterIntegration:
    """Test the retrieval_router_node that picks strategies."""

    @patch("app.services.retrieval_router.has_document_trees")
    def test_router_node_backward_compatible(self, mock_has_trees):
        """Agents with no trees always get vector, even in auto mode."""
        from app.agent.graph import retrieval_router_node
        mock_has_trees.return_value = False

        state = {
            "bot_id": "bot_legacy",
            "query": "what is the policy?",
            "intent": "rag",
            "context": "",
            "sql_result": "",
            "restricted_tables": [],
            "retrieval_mode": "auto",
            "retrieval_strategy": "",
            "retrieval_trace": [],
            "retrieval_source": "",
            "retrieval_quality": 0.0,
        }

        result = retrieval_router_node(state)
        assert result["retrieval_strategy"] == "vector"
