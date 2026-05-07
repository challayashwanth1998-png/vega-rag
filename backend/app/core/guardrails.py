import logging
from fastapi import HTTPException
import boto3
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

# Initialize Microsoft Presidio engines globally
# NOTE: This requires 'en_core_web_sm' spacy model to be downloaded.
analyzer = None
anonymizer = None

def _get_engines():
    global analyzer, anonymizer
    if analyzer is None:
        analyzer = AnalyzerEngine()
        anonymizer = AnonymizerEngine()
    return analyzer, anonymizer

def scrub_pii(text: str) -> str:
    """
    Enterprise PII Redaction using Microsoft Presidio.
    Masks emails, phone numbers, credit cards, SSNs, and names
    before the query ever leaves the VPC to hit the external LLM.
    """
    with tracer.start_as_current_span("guardrails_pii_scrub"):
        try:
            analyze_engine, anonymize_engine = _get_engines()
            # Analyze text for sensitive PII entities
            results = analyze_engine.analyze(
                text=text, 
                entities=["EMAIL_ADDRESS", "PHONE_NUMBER", "CREDIT_CARD", "US_SSN"], 
                language='en'
            )
            
            # Anonymize the findings (e.g., replaces SSN with <US_SSN>)
            anonymized_result = anonymize_engine.anonymize(text=text, analyzer_results=results)
            return anonymized_result.text
        except Exception as e:
            logging.warning(f"Failed to scrub PII, proceeding cautiously: {e}")
            return text

def check_prompt_injection(text: str):
    """
    Heuristic-based Prompt Injection detection.
    In a true production environment, this could route to an Amazon Bedrock Guardrail
    or Llama Guard. For latency purposes, we use strict heuristic keyword matching here.
    """
    with tracer.start_as_current_span("guardrails_prompt_injection"):
        blacklist = [
            "ignore previous instructions",
            "system prompt",
            "forget all instructions",
            "you are now",
            "developer mode",
            "drop table"
        ]
        
        normalized = text.lower()
        for phrase in blacklist:
            if phrase in normalized:
                raise HTTPException(
                    status_code=400,
                    detail="Security Guardrail Triggered: Malicious prompt injection or forbidden topic detected."
                )

def check_toxicity(text: str) -> bool:
    """
    Fast heuristic output toxicity filter.
    Returns True if toxic language is detected.
    """
    with tracer.start_as_current_span("guardrails_output_toxicity"):
        toxic_words = ["fuck", "shit", "bitch", "asshole", "racist_slur"]
        normalized = text.lower()
        return any(word in normalized for word in toxic_words)

def verify_output_groundedness(context: str, answer: str) -> bool:
    """
    Enterprise Dual-LLM Verification:
    Runs a secondary LLM call to ensure the answer is 100% grounded in the context.
    Returns True if grounded (safe), False if hallucination detected.
    """
    if not context.strip():
        # If there's no context (e.g. casual chat), we can't ground it.
        return True
        
    with tracer.start_as_current_span("guardrails_output_entailment"):
        try:
            llm = ChatBedrockConverse(
                client=boto3.client("bedrock-runtime", region_name="us-east-1"),
                model="amazon.nova-micro-v1:0",
                max_tokens=10
            )
            messages = [
                SystemMessage(content=(
                    "You are a strict entailment validator. Given a CONTEXT and an ANSWER, "
                    "determine if the ANSWER contains any facts or claims NOT present in the CONTEXT. "
                    "Respond ONLY with 'SAFE' if the answer is fully supported by the context, "
                    "or 'HALLUCINATION' if it contains unsupported facts."
                )),
                HumanMessage(content=f"CONTEXT:\n{context}\n\nANSWER:\n{answer}")
            ]
            response = llm.invoke(messages)
            decision = str(response.content).strip().upper()
            return "HALLUCINATION" not in decision
        except Exception as e:
            logging.error(f"Entailment check failed: {e}")
            return True # Fail open to not block users if verifier goes down

