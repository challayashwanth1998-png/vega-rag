import os
import boto3
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.pinecone_service import index, embeddings

# The schema tracking variables as the agent loops through nodes
class AgentState(TypedDict):
    bot_id: str
    query: str
    context: str

# NODE 1: Pure Retrieval
def retrieve_node(state: AgentState):
    """Searches Pinecone for exact chunk matches."""
    print("-> Triggering Memory Node...")
    query_vector = embeddings.embed_query(state["query"])
    
    search_results = index.query(
        namespace=state["bot_id"],
        vector=query_vector,
        top_k=5,
        include_metadata=True
    )
    
    # Grab the text out of the metadata we injected into Pinecone
    context_chunks = []
    for match in search_results['matches']:
        if 'text' in match['metadata']:
            context_chunks.append(match['metadata']['text'])
            
    context_text = "\n\n---\n\n".join(context_chunks)
    return {"context": context_text}

# NODE 2: Generation Engine Setup
def answer_node(state: AgentState):
    """This node is merely a placeholder if we want LangGraph to mutate state. 
    However, for high-performance SSE streaming, we generally bypass this node 
    and call the LLM directly in the router using the context grabbed here."""
    return {}

# Build the Graph (Very simple for now, but allows complex Tool loops later!)
graph = StateGraph(AgentState)
graph.add_node("retrieve", retrieve_node)
graph.add_node("answer", answer_node)

graph.set_entry_point("retrieve")
graph.add_edge("retrieve", "answer")
graph.add_edge("answer", END)

# Compile into an executable engine
agent_executor = graph.compile()
