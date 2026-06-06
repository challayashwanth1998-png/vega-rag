"""
Shared test fixtures — mocks global singletons that would otherwise
require live AWS/Pinecone credentials at import time.

The key challenge: pinecone_service.py creates Pinecone and Bedrock
clients AT IMPORT TIME (module-level singletons). Without valid
credentials, the import hangs or fails.

Solution: Mock the pinecone module and boto3 BEFORE any app code imports.
"""
import os
import sys
import pytest
from unittest.mock import MagicMock, patch

# ── Set dummy env vars BEFORE any app module is imported ──────────────────────
os.environ["AWS_REGION"] = "us-east-1"
os.environ["AWS_ACCESS_KEY_ID"] = "test"
os.environ["AWS_SECRET_ACCESS_KEY"] = "test"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
os.environ["PINECONE_API_KEY"] = "test-key"
os.environ["PINECONE_INDEX_NAME"] = "test-index"
os.environ["DYNAMODB_TABLE_NAME"] = "TestDB"
os.environ["S3_DOCUMENT_BUCKET"] = ""

# ── Pre-mock pinecone module to prevent real connection at import time ─────────
mock_pinecone_module = MagicMock()
mock_pc_instance = MagicMock()
mock_pinecone_index = MagicMock()
mock_pinecone_index.query.return_value = {"matches": []}
mock_pinecone_index.upsert.return_value = None
mock_pc_instance.Index.return_value = mock_pinecone_index
mock_pinecone_module.Pinecone.return_value = mock_pc_instance
sys.modules.setdefault("pinecone", mock_pinecone_module)

# ── Pre-mock presidio to prevent heavy NLP model load ──────────────────────────
mock_presidio_analyzer = MagicMock()
mock_presidio_anonymizer = MagicMock()
sys.modules.setdefault("presidio_analyzer", mock_presidio_analyzer)
sys.modules.setdefault("presidio_anonymizer", mock_presidio_anonymizer)

# ── Pre-mock spacy ─────────────────────────────────────────────────────────────
sys.modules.setdefault("spacy", MagicMock())

# ── Pre-mock OpenTelemetry exporters that need gRPC ────────────────────────────
sys.modules.setdefault("opentelemetry.exporter.otlp.proto.grpc.trace_exporter", MagicMock())
sys.modules.setdefault("opentelemetry.sdk.extension.aws.trace.aws_xray_id_generator", MagicMock())
