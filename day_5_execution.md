# Day 5 Execution Guide: The "Action" Agent & Streaming Answers

Today, we build the "Brain" of your SaaS platform which completes the RAG (Retrieval-Augmented Generation) loop. 

We will create a **LangGraph StateGraph** that gives your AI logical steps:
1. Recieve a question from the user via the `POST /api/chat` router.
2. Route step 1 to a **Retrieval Node** that searches your specific Pinecone Namespace for relevant 1,024-dimension vectors.
3. Route step 2 to an **Answer Node** that hands the vectors and the user question to Amazon Nova Micro.
4. Stream the raw output character-by-character back to the user using Server-Sent Events (SSE).

*(Note: We also quietly updated `pinecone_service.py` to ensure raw chunk text is saved in Pinecone metadata so the LLM can read it!)*

---

## 1. The Architecture I Just Built
I automatically created the following files to power your Chat Endpoint:
* **`backend/app/agent/graph.py`**: The definitive state machine connecting memory to generation.
* **`backend/app/api/routers/chat.py`**: A streaming FastAPI endpoint using `StreamingResponse`.
* **`backend/app/main.py`**: Wired the new `/api/chat` endpoint into your active server!

## 2. Re-Crawling Wikipedia (With Text Metadata)
Because our Day 4 web crawler didn't explicitly save the raw text string into the Pinecone metadata (meaning the LLM couldn't read the chunks we saved), we need to hit the Crawl API one more time to fix the database!

Run this in your terminal to re-ingest Black Holes:
```bash
curl -X POST http://localhost:8000/api/crawl \
     -H "Content-Type: application/json" \
     -d '{"url": "https://en.wikipedia.org/wiki/Black_hole", "bot_id": "test_agent_123"}'
```

## 3. Testing the Brain!
Once Wikipedia is re-ingested with the correct metadata, it is time to ask Amazon Nova Micro about Black Holes. Because we are streaming the answer, `curl` will show the chunks arriving instantly like ChatGPT typing!

Run this in a new terminal tab:
```bash
curl -N -X POST http://localhost:8000/api/chat \
     -H "Content-Type: application/json" \
     -H "Accept: text/event-stream" \
     -d '{"query": "What is the event horizon of a black hole?", "bot_id": "test_agent_123"}'
```

If it works, the terminal will slowly print out paragraphs of incredibly accurate text drawn entirely from the Wikipedia article!
