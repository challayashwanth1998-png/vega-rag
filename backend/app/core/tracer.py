import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.extension.aws.trace.aws_xray_id_generator import AwsXRayIdGenerator

def setup_tracing(service_name: str = "vegarag-backend"):
    """
    Configure OpenTelemetry to trace requests across FastAPI, LangGraph, and AWS Bedrock.
    Automatically formats Trace IDs to be compatible with AWS X-Ray.
    """
    resource = Resource.create({"service.name": service_name})
    
    # Use AWS X-Ray ID generator so traces match the X-Ray format exactly
    provider = TracerProvider(
        resource=resource,
        id_generator=AwsXRayIdGenerator()
    )
    
    # Check if we should export to an OTLP endpoint (e.g. AWS Distro for OTEL)
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if otlp_endpoint:
        processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint))
        provider.add_span_processor(processor)
    else:
        # Fallback for right now: Print traces directly to CloudWatch logs
        # so the user can see it in action without the ADOT sidecar.
        processor = BatchSpanProcessor(ConsoleSpanExporter())
        provider.add_span_processor(processor)
        
    trace.set_tracer_provider(provider)
