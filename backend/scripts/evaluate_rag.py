import os
import json
import boto3
import sys
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import HumanMessage, SystemMessage

def evaluate_faithfulness(evaluator, question, context, answer):
    prompt = f"""You are an expert RAG evaluator. 
Given the QUESTION, CONTEXT, and ANSWER, determine if the ANSWER is completely faithful to the CONTEXT.
If the answer contains hallucinations or external facts, score it 0.0. If it is 100% supported by the context, score it 1.0.
Return ONLY a float value (e.g. 0.0 or 1.0). Do not output any other text.

QUESTION: {question}
CONTEXT: {context}
ANSWER: {answer}
"""
    try:
        resp = evaluator.invoke([HumanMessage(content=prompt)])
        return float(resp.content.strip())
    except:
        return 0.0

def evaluate_context_relevance(evaluator, question, context):
    prompt = f"""You are an expert RAG evaluator.
Given the QUESTION and the retrieved CONTEXT, score how relevant the CONTEXT is to answering the QUESTION.
Score 1.0 if highly relevant, 0.5 if partially relevant, and 0.0 if completely irrelevant.
Return ONLY a float value (e.g. 0.0, 0.5, 1.0). Do not output any other text.

QUESTION: {question}
CONTEXT: {context}
"""
    try:
        resp = evaluator.invoke([HumanMessage(content=prompt)])
        return float(resp.content.strip())
    except:
        return 0.0

def main():
    print("Initializing LLM-as-a-Judge Evaluator (Amazon Nova)...")
    try:
        evaluator = ChatBedrockConverse(
            client=boto3.client("bedrock-runtime", region_name=os.getenv("AWS_REGION", "us-east-1")),
            model="amazon.nova-micro-v1:0",
        )
    except Exception as e:
        print(f"Failed to initialize AWS Bedrock: {e}")
        sys.exit(1)

    dataset_path = os.path.join(os.path.dirname(__file__), "golden_dataset.json")
    with open(dataset_path, "r") as f:
        dataset = json.load(f)
        
    total_faithfulness = 0
    total_relevance = 0
    
    print(f"Loaded Golden Dataset with {len(dataset)} examples. Starting Evaluation...\n")
    
    # In a full MLOps pipeline, we would fetch live answers from the /chat API dynamically.
    # Here we simulate evaluating the RAG trace logs against the golden expected context.
    for item in dataset:
        print(f"Evaluating Q: {item['question']}")
        
        f_score = evaluate_faithfulness(evaluator, item["question"], item["context"], item["answer"])
        r_score = evaluate_context_relevance(evaluator, item["question"], item["context"])
        
        total_faithfulness += f_score
        total_relevance += r_score
        print(f" -> Faithfulness: {f_score} | Relevance: {r_score}")
        
    avg_faithfulness = total_faithfulness / len(dataset)
    avg_relevance = total_relevance / len(dataset)
    
    print("\n" + "="*30)
    print(" RAG Evaluation Summary ")
    print("="*30)
    print(f"Average Faithfulness:      {avg_faithfulness:.2f} (Target: > 0.85)")
    print(f"Average Context Relevance: {avg_relevance:.2f} (Target: > 0.70)")
    print("="*30)
    
    # CI/CD Quality Gate
    if avg_faithfulness < 0.85 or avg_relevance < 0.70:
        print("\n❌ FAILED: RAG Quality Gate threshold not met. Build failed.")
        sys.exit(1)
    else:
        print("\n✅ PASSED: RAG Quality Gate met. Ready to deploy.")
        sys.exit(0)

if __name__ == "__main__":
    main()
