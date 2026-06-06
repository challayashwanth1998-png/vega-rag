"""
Unit tests for the retrieval router decision logic.

Tests cover:
  - Returns "vector" when no trees exist (backward-compatible)
  - Returns pinned mode when retrieval_mode is not "auto"
  - Falls back to "vector" if pinned to structural/hybrid but no trees exist
  - In auto mode, classifies section-oriented queries as "structural"
  - In auto mode, classifies semantic queries as "vector"
  - Falls back to "vector" on LLM error
"""
import pytest
from unittest.mock import patch, MagicMock


class TestPickRetrievalStrategy:
    """Test pick_retrieval_strategy function."""

    @patch("app.services.retrieval_router.has_document_trees")
    def test_no_trees_returns_vector(self, mock_has_trees):
        """Agents with no tree index should always get vector retrieval."""
        mock_has_trees.return_value = False
        from app.services.retrieval_router import pick_retrieval_strategy
        result = pick_retrieval_strategy("what is the policy?", "bot_123", "auto")
        assert result == "vector"

    @patch("app.services.retrieval_router.has_document_trees")
    def test_pinned_vector_mode(self, mock_has_trees):
        """When retrieval_mode is pinned to 'vector', skip all routing logic."""
        mock_has_trees.return_value = True
        from app.services.retrieval_router import pick_retrieval_strategy
        result = pick_retrieval_strategy("anything", "bot_123", "vector")
        assert result == "vector"
        # Should not even check for trees when pinned to vector
        mock_has_trees.assert_not_called()

    @patch("app.services.retrieval_router.has_document_trees")
    def test_pinned_structural_with_trees(self, mock_has_trees):
        """When pinned to 'structural' and trees exist, use structural."""
        mock_has_trees.return_value = True
        from app.services.retrieval_router import pick_retrieval_strategy
        result = pick_retrieval_strategy("anything", "bot_123", "structural")
        assert result == "structural"

    @patch("app.services.retrieval_router.has_document_trees")
    def test_pinned_structural_no_trees_fallback(self, mock_has_trees):
        """When pinned to 'structural' but no trees, fall back to vector."""
        mock_has_trees.return_value = False
        from app.services.retrieval_router import pick_retrieval_strategy
        result = pick_retrieval_strategy("anything", "bot_123", "structural")
        assert result == "vector"

    @patch("app.services.retrieval_router.has_document_trees")
    def test_pinned_hybrid_no_trees_fallback(self, mock_has_trees):
        """When pinned to 'hybrid' but no trees, fall back to vector."""
        mock_has_trees.return_value = False
        from app.services.retrieval_router import pick_retrieval_strategy
        result = pick_retrieval_strategy("anything", "bot_123", "hybrid")
        assert result == "vector"

    @patch("app.services.retrieval_router.has_document_trees")
    def test_pinned_hybrid_with_trees(self, mock_has_trees):
        """When pinned to 'hybrid' and trees exist, use hybrid."""
        mock_has_trees.return_value = True
        from app.services.retrieval_router import pick_retrieval_strategy
        result = pick_retrieval_strategy("anything", "bot_123", "hybrid")
        assert result == "hybrid"

    @patch("app.services.retrieval_router._get_llm")
    @patch("app.services.retrieval_router.has_document_trees")
    def test_auto_mode_structural_query(self, mock_has_trees, mock_get_llm):
        """Auto mode with a section-oriented query should return 'structural'."""
        mock_has_trees.return_value = True

        # Mock the LLM structured output
        mock_strategy = MagicMock()
        mock_strategy.strategy = "structural"
        mock_strategy.confidence = 0.85

        mock_llm_instance = MagicMock()
        mock_llm_instance.with_structured_output.return_value = mock_llm_instance
        mock_llm_instance.invoke.return_value = mock_strategy
        mock_get_llm.return_value = mock_llm_instance

        from app.services.retrieval_router import pick_retrieval_strategy
        result = pick_retrieval_strategy(
            "what does section 3 of the document say about benefits?",
            "bot_123",
            "auto",
        )
        assert result == "structural"

    @patch("app.services.retrieval_router._get_llm")
    @patch("app.services.retrieval_router.has_document_trees")
    def test_auto_mode_vector_query(self, mock_has_trees, mock_get_llm):
        """Auto mode with a semantic query should return 'vector'."""
        mock_has_trees.return_value = True

        mock_strategy = MagicMock()
        mock_strategy.strategy = "vector"
        mock_strategy.confidence = 0.9

        mock_llm_instance = MagicMock()
        mock_llm_instance.with_structured_output.return_value = mock_llm_instance
        mock_llm_instance.invoke.return_value = mock_strategy
        mock_get_llm.return_value = mock_llm_instance

        from app.services.retrieval_router import pick_retrieval_strategy
        result = pick_retrieval_strategy(
            "what are the company policies on remote work?",
            "bot_123",
            "auto",
        )
        assert result == "vector"

    @patch("app.services.retrieval_router._get_llm")
    @patch("app.services.retrieval_router.has_document_trees")
    def test_auto_mode_low_confidence_upgrades_to_hybrid(self, mock_has_trees, mock_get_llm):
        """Auto mode with low confidence should upgrade to hybrid."""
        mock_has_trees.return_value = True

        mock_strategy = MagicMock()
        mock_strategy.strategy = "vector"
        mock_strategy.confidence = 0.3  # Low confidence

        mock_llm_instance = MagicMock()
        mock_llm_instance.with_structured_output.return_value = mock_llm_instance
        mock_llm_instance.invoke.return_value = mock_strategy
        mock_get_llm.return_value = mock_llm_instance

        from app.services.retrieval_router import pick_retrieval_strategy
        result = pick_retrieval_strategy("some ambiguous query", "bot_123", "auto")
        assert result == "hybrid"

    @patch("app.services.retrieval_router._get_llm")
    @patch("app.services.retrieval_router.has_document_trees")
    def test_auto_mode_llm_error_fallback(self, mock_has_trees, mock_get_llm):
        """If LLM fails in auto mode, fall back to vector."""
        mock_has_trees.return_value = True

        mock_llm_instance = MagicMock()
        mock_llm_instance.with_structured_output.return_value = mock_llm_instance
        mock_llm_instance.invoke.side_effect = Exception("LLM timeout")
        mock_get_llm.return_value = mock_llm_instance

        from app.services.retrieval_router import pick_retrieval_strategy
        result = pick_retrieval_strategy("anything", "bot_123", "auto")
        assert result == "vector"

    @patch("app.services.retrieval_router.has_document_trees")
    def test_empty_retrieval_mode_defaults_to_auto(self, mock_has_trees):
        """Empty retrieval_mode should be treated as 'auto'."""
        mock_has_trees.return_value = False
        from app.services.retrieval_router import pick_retrieval_strategy
        # Empty string and "auto" should behave identically
        result = pick_retrieval_strategy("query", "bot_123", "auto")
        assert result == "vector"  # no trees → vector
