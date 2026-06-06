"""
Unit tests for the hybrid retriever merge/dedupe/rerank logic.

Tests cover:
  - Deduplication removes passages with identical content hashes
  - Reranking sorts by score correctly
  - Empty vector + valid structural → structural only
  - Valid vector + empty structural → vector only
  - Both empty → empty result
  - Content hash is based on first 200 chars
"""
import pytest
from unittest.mock import patch, MagicMock


class TestContentHash:
    """Test the _content_hash deduplication helper."""

    def test_identical_texts_same_hash(self):
        from app.services.hybrid_retriever import _content_hash
        h1 = _content_hash("This is a test passage about benefits.")
        h2 = _content_hash("This is a test passage about benefits.")
        assert h1 == h2

    def test_different_texts_different_hash(self):
        from app.services.hybrid_retriever import _content_hash
        h1 = _content_hash("This is about benefits.")
        h2 = _content_hash("This is about compensation.")
        assert h1 != h2

    def test_whitespace_normalization(self):
        from app.services.hybrid_retriever import _content_hash
        h1 = _content_hash("  This is a test.  ")
        h2 = _content_hash("This is a test.")
        assert h1 == h2

    def test_only_first_200_chars_matter(self):
        from app.services.hybrid_retriever import _content_hash
        prefix = "A" * 200
        h1 = _content_hash(prefix + " DIFFERENT ENDING 1")
        h2 = _content_hash(prefix + " DIFFERENT ENDING 2")
        assert h1 == h2


class TestDeduplicate:
    """Test the _deduplicate function."""

    def test_removes_duplicates(self):
        from app.services.hybrid_retriever import _deduplicate
        passages = [
            {"text": "Benefits include health insurance.", "score": 0.9, "source": "vector"},
            {"text": "Benefits include health insurance.", "score": 7.5, "source": "structural"},
            {"text": "Compensation is competitive.", "score": 0.8, "source": "vector"},
        ]
        result = _deduplicate(passages)
        assert len(result) == 2
        # First occurrence should be kept
        assert result[0]["source"] == "vector"
        assert result[0]["score"] == 0.9

    def test_no_duplicates_keeps_all(self):
        from app.services.hybrid_retriever import _deduplicate
        passages = [
            {"text": "First unique passage.", "score": 0.9, "source": "vector"},
            {"text": "Second unique passage.", "score": 0.8, "source": "structural"},
        ]
        result = _deduplicate(passages)
        assert len(result) == 2

    def test_empty_list(self):
        from app.services.hybrid_retriever import _deduplicate
        result = _deduplicate([])
        assert result == []

    def test_single_passage(self):
        from app.services.hybrid_retriever import _deduplicate
        passages = [{"text": "Only one.", "score": 1.0, "source": "vector"}]
        result = _deduplicate(passages)
        assert len(result) == 1


class TestRerank:
    """Test the _rerank function."""

    @patch("app.services.hybrid_retriever._get_llm")
    def test_reranking_sorts_by_score(self, mock_get_llm):
        from app.services.hybrid_retriever import _rerank

        # Mock LLM reranker response
        mock_result = MagicMock()
        mock_score_0 = MagicMock()
        mock_score_0.index = 0
        mock_score_0.score = 3.0
        mock_score_1 = MagicMock()
        mock_score_1.index = 1
        mock_score_1.score = 9.0
        mock_result.scores = [mock_score_0, mock_score_1]

        mock_llm = MagicMock()
        mock_llm.with_structured_output.return_value = mock_llm
        mock_llm.invoke.return_value = mock_result
        mock_get_llm.return_value = mock_llm

        passages = [
            {"text": "Low relevance passage.", "score": 0.5, "source": "vector"},
            {"text": "High relevance passage.", "score": 0.3, "source": "structural"},
        ]
        result = _rerank("query about relevance", passages)
        assert result[0]["rerank_score"] == 9.0
        assert result[1]["rerank_score"] == 3.0

    def test_single_passage_no_rerank(self):
        from app.services.hybrid_retriever import _rerank
        passages = [{"text": "Solo.", "score": 5.0, "source": "vector"}]
        result = _rerank("query", passages)
        assert len(result) == 1

    @patch("app.services.hybrid_retriever._get_llm")
    def test_rerank_error_fallback(self, mock_get_llm):
        from app.services.hybrid_retriever import _rerank

        mock_llm = MagicMock()
        mock_llm.with_structured_output.return_value = mock_llm
        mock_llm.invoke.side_effect = Exception("LLM error")
        mock_get_llm.return_value = mock_llm

        passages = [
            {"text": "First.", "score": 0.9, "source": "vector"},
            {"text": "Second.", "score": 0.8, "source": "structural"},
        ]
        result = _rerank("query", passages)
        # Should return original order on error
        assert len(result) == 2


class TestVectorRetrieve:
    """Test the _vector_retrieve function."""

    @patch("app.services.hybrid_retriever.embeddings")
    @patch("app.services.hybrid_retriever.index")
    def test_empty_matches_returns_empty(self, mock_index, mock_embeddings):
        from app.services.hybrid_retriever import _vector_retrieve
        mock_embeddings.embed_query.return_value = [0.0] * 1024
        mock_index.query.return_value = {"matches": []}

        result = _vector_retrieve("query", "bot_123")
        assert result["contexts"] == []
        assert result["source"] == "vector"

    @patch("app.services.hybrid_retriever.reciprocal_rank_fusion")
    @patch("app.services.hybrid_retriever.bm25_score")
    @patch("app.services.hybrid_retriever.embeddings")
    @patch("app.services.hybrid_retriever.index")
    def test_returns_fused_results(self, mock_index, mock_embeddings, mock_bm25, mock_rrf):
        from app.services.hybrid_retriever import _vector_retrieve
        mock_embeddings.embed_query.return_value = [0.0] * 1024
        mock_index.query.return_value = {
            "matches": [
                {"id": "c1", "metadata": {"text": "chunk 1"}, "score": 0.9},
                {"id": "c2", "metadata": {"text": "chunk 2"}, "score": 0.8},
            ]
        }
        mock_bm25.return_value = 1.0
        mock_rrf.return_value = [
            ({"id": "c1", "metadata": {"text": "chunk 1"}}, 0.03),
            ({"id": "c2", "metadata": {"text": "chunk 2"}}, 0.02),
        ]

        result = _vector_retrieve("query", "bot_123")
        assert len(result["contexts"]) == 2
        assert result["source"] == "vector"
        assert "chunk 1" in result["contexts"]


class TestHybridRetrieveIntegration:
    """Test the full hybrid_retrieve flow with mocked retrievers."""

    @patch("app.services.hybrid_retriever._rerank")
    @patch("app.services.hybrid_retriever.structural_retrieve")
    @patch("app.services.hybrid_retriever._vector_retrieve")
    def test_both_empty_returns_empty(self, mock_vector, mock_structural, mock_rerank):
        from app.services.hybrid_retriever import hybrid_retrieve

        mock_vector.return_value = {"contexts": [], "source": "vector", "scores": [], "retrieval_trace": []}
        mock_structural.return_value = {"contexts": [], "source": "structural", "scores": [], "retrieval_trace": []}

        result = hybrid_retrieve("query", "bot_123")
        assert result["contexts"] == []
        assert result["source"] == "hybrid"

    @patch("app.services.hybrid_retriever._rerank")
    @patch("app.services.hybrid_retriever.structural_retrieve")
    @patch("app.services.hybrid_retriever._vector_retrieve")
    def test_vector_only_when_structural_empty(self, mock_vector, mock_structural, mock_rerank):
        from app.services.hybrid_retriever import hybrid_retrieve

        mock_vector.return_value = {
            "contexts": ["vector chunk 1"],
            "source": "vector",
            "scores": [0.9],
            "retrieval_trace": [],
        }
        mock_structural.return_value = {"contexts": [], "source": "structural", "scores": [], "retrieval_trace": []}

        # Rerank returns passages as-is
        mock_rerank.side_effect = lambda q, p: p

        result = hybrid_retrieve("query", "bot_123")
        assert len(result["contexts"]) == 1
        assert "vector chunk 1" in result["contexts"]

    @patch("app.services.hybrid_retriever._rerank")
    @patch("app.services.hybrid_retriever.structural_retrieve")
    @patch("app.services.hybrid_retriever._vector_retrieve")
    def test_structural_only_when_vector_empty(self, mock_vector, mock_structural, mock_rerank):
        from app.services.hybrid_retriever import hybrid_retrieve

        mock_vector.return_value = {"contexts": [], "source": "vector", "scores": [], "retrieval_trace": []}
        mock_structural.return_value = {
            "contexts": ["structural section 1"],
            "source": "structural",
            "scores": [8.0],
            "retrieval_trace": [{"node_id": "sec_0", "action": "select"}],
        }

        mock_rerank.side_effect = lambda q, p: p

        result = hybrid_retrieve("query", "bot_123")
        assert len(result["contexts"]) == 1
        assert "structural section 1" in result["contexts"]
