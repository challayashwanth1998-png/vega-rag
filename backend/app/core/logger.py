import logging
import sys
import structlog
from asgi_correlation_id import correlation_id

def setup_logging(json_logs: bool = True):
    """
    Configures structlog to output either human-readable console logs or JSON logs.
    In an enterprise setting, `json_logs` should be True in production to ship to ELK/OpenSearch.
    """
    timestamper = structlog.processors.TimeStamper(fmt="iso")

    shared_processors = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        timestamper,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        # Add the correlation ID to every log record
        structlog.processors.CallsiteParameterAdder(
            {
                structlog.processors.CallsiteParameter.FILENAME,
                structlog.processors.CallsiteParameter.FUNC_NAME,
                structlog.processors.CallsiteParameter.LINENO,
            }
        ),
    ]

    # Function to dynamically inject request/tenant contexts
    def add_correlation_id(logger, method_name, event_dict):
        request_id = correlation_id.get()
        if request_id:
            event_dict["trace_id"] = request_id
        return event_dict

    shared_processors.insert(0, add_correlation_id)

    if json_logs:
        # JSON formatting for production (ELK/OpenSearch)
        processors = shared_processors + [
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]
    else:
        # Human-readable formatting for local development
        processors = shared_processors + [
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.dev.ConsoleRenderer(),
        ]

    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configure standard logging to route through structlog
    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            structlog.processors.JSONRenderer() if json_logs else structlog.dev.ConsoleRenderer(),
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    
    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

    # Disable uvicorn access logs to avoid duplicate noise, we will log requests manually if needed
    logging.getLogger("uvicorn.access").handlers.clear()
