"""
Unit tests for the document tree service.

Tests cover:
  - Tree building produces valid node structure
  - Character range finding
  - Document ID generation is deterministic
  - Tree loading from DynamoDB returns correct hierarchy
"""
import pytest
from unittest.mock import patch, MagicMock


class TestDocIdGeneration:
    """Test _doc_id_from_source deterministic hashing."""

    def test_deterministic(self):
        from app.services.tree_service import _doc_id_from_source
        id1 = _doc_id_from_source("SOURCE#PDF#resume.pdf")
        id2 = _doc_id_from_source("SOURCE#PDF#resume.pdf")
        assert id1 == id2

    def test_different_sources_different_ids(self):
        from app.services.tree_service import _doc_id_from_source
        id1 = _doc_id_from_source("SOURCE#PDF#resume.pdf")
        id2 = _doc_id_from_source("SOURCE#PDF#contract.pdf")
        assert id1 != id2

    def test_length_is_16(self):
        from app.services.tree_service import _doc_id_from_source
        doc_id = _doc_id_from_source("any source identifier")
        assert len(doc_id) == 16


class TestFindCharRange:
    """Test _find_char_range helper."""

    def test_finds_exact_range(self):
        from app.services.tree_service import _find_char_range
        text = "Introduction to the topic. Main body of the document. Conclusion and summary."
        start, end = _find_char_range(text, "Main body", "and summary")
        assert start == text.lower().find("main body")
        assert end > start

    def test_missing_start_defaults_to_zero(self):
        from app.services.tree_service import _find_char_range
        text = "Some document text here."
        start, end = _find_char_range(text, "NONEXISTENT_PHRASE", "text here")
        assert start == 0

    def test_missing_end_defaults_to_length(self):
        from app.services.tree_service import _find_char_range
        text = "Some document text here."
        start, end = _find_char_range(text, "Some document", "NONEXISTENT")
        assert end == len(text)


class TestBuildDocumentTree:
    """Test build_document_tree with mocked LLM."""

    @patch("app.services.tree_service._get_table")
    @patch("app.services.tree_service._segment_text_into_sections")
    def test_builds_tree_with_sections(self, mock_segment, mock_get_table):
        from app.services.tree_service import build_document_tree

        # Mock section segmentation
        mock_segment.return_value = [
            {
                "title": "Introduction",
                "summary": "Overview of the document",
                "start_phrase": "this document provides",
                "end_phrase": "background information",
            },
            {
                "title": "Benefits",
                "summary": "Company benefits section",
                "start_phrase": "the company offers",
                "end_phrase": "additional perks",
            },
        ]

        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_get_table.return_value = mock_table

        full_text = (
            "This document provides an overview and background information. "
            "The company offers many benefits including health and additional perks. "
            "Thank you for reading."
        )

        result = build_document_tree(
            full_text=full_text,
            bot_id="bot_test",
            source_identifier="test.pdf",
            doc_title="Test Document",
        )

        assert result is not None
        assert result["node_id"] == "root"
        assert result["level"] == 0
        assert len(result["children"]) == 2
        assert "sec_0" in result["children"]
        assert "sec_1" in result["children"]

        # Verify DynamoDB was called
        assert mock_table.put_item.called

    @patch("app.services.tree_service._segment_text_into_sections")
    def test_short_text_returns_none(self, mock_segment):
        from app.services.tree_service import build_document_tree

        result = build_document_tree(
            full_text="Too short.",
            bot_id="bot_test",
            source_identifier="short.pdf",
        )
        assert result is None
        mock_segment.assert_not_called()

    @patch("app.services.tree_service._segment_text_into_sections")
    def test_no_sections_found_returns_none(self, mock_segment):
        from app.services.tree_service import build_document_tree

        mock_segment.return_value = []
        result = build_document_tree(
            full_text="A" * 500,  # Long enough but no sections found
            bot_id="bot_test",
            source_identifier="bland.pdf",
        )
        assert result is None


class TestLoadDocumentTrees:
    """Test load_document_trees with mocked DynamoDB."""

    @patch("app.services.tree_service._get_table")
    def test_loads_trees_correctly(self, mock_get_table):
        import json
        from app.services.tree_service import load_document_trees

        mock_table = MagicMock()
        mock_get_table.return_value = mock_table

        tree_nodes = [
            {"node_id": "root", "title": "Doc", "level": 0, "children": ["sec_0"]},
            {"node_id": "sec_0", "title": "Intro", "level": 1, "children": []},
        ]

        mock_table.query.return_value = {
            "Items": [{
                "PK": "AGENT#bot_123",
                "SK": "TREE#abc123#root",
                "doc_id": "abc123",
                "source_identifier": "test.pdf",
                "tree_json": json.dumps(tree_nodes),
                "full_text": "Full text of the document.",
            }]
        }

        trees = load_document_trees("bot_123")
        assert len(trees) == 1
        assert trees[0]["doc_id"] == "abc123"
        assert len(trees[0]["nodes"]) == 2
        assert trees[0]["full_text"] == "Full text of the document."

    @patch("app.services.tree_service._get_table")
    def test_empty_result_returns_empty_list(self, mock_get_table):
        from app.services.tree_service import load_document_trees

        mock_table = MagicMock()
        mock_get_table.return_value = mock_table
        mock_table.query.return_value = {"Items": []}

        trees = load_document_trees("bot_no_trees")
        assert trees == []


class TestHasDocumentTrees:
    """Test has_document_trees quick check."""

    @patch("app.services.tree_service._get_table")
    def test_returns_true_when_trees_exist(self, mock_get_table):
        from app.services.tree_service import has_document_trees

        mock_table = MagicMock()
        mock_get_table.return_value = mock_table
        mock_table.query.return_value = {"Count": 1}

        assert has_document_trees("bot_123") is True

    @patch("app.services.tree_service._get_table")
    def test_returns_false_when_no_trees(self, mock_get_table):
        from app.services.tree_service import has_document_trees

        mock_table = MagicMock()
        mock_get_table.return_value = mock_table
        mock_table.query.return_value = {"Count": 0}

        assert has_document_trees("bot_123") is False

    @patch("app.services.tree_service._get_table")
    def test_returns_false_on_error(self, mock_get_table):
        from app.services.tree_service import has_document_trees

        mock_table = MagicMock()
        mock_get_table.return_value = mock_table
        mock_table.query.side_effect = Exception("DynamoDB error")

        assert has_document_trees("bot_123") is False
