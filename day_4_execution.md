# Day 4 Execution Guide: URL Crawling & Data Sync API

Today, we write the very first FastAPI production code! We will build the system that allows your users to paste a Wikipedia link, instantly scrape its contents, and insert it directly into the Pinecone database using the AWS Models we set up yesterday.

## The Architecture
1. **The Downloader (`scraper.py`)**: A Python utility that downloads a website's HTML, strips away all the useless Javascript/Ads, and creates "Chunks" of pure text roughly 1,000 characters long using LangChain. 
2. **The Vector Manager (`pinecone_service.py`)**: A core utility that groups those text chunks, passes them to Bedrock (Titan V2) in bulk for embedding, and shoots them to Pinecone under the specific `<bot_id>` namespace.
3. **The API Switchboard (`crawl.py` & `main.py`)**: The FastAPI router endpoint `POST /api/crawl` that Next.js talks to!

---

## What Just Happened?
I went ahead and **generated all 4 Python files** into your `/backend` folder automatically!

1. I installed `beautifulsoup4` into your terminal so Python can parse HTML websites.
2. I built the API Endpoint at `POST /api/crawl`. 

You can literally test the API right now locally!

## How to Test Day 4:
To prove your entire AWS Ingestion pipeline works end-to-end, we are going to scrape Wikipedia and force the AI to read an article about "Black Holes".

Run this command locally in a new terminal:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Once the server is running on port 8000, open a completely new terminal and send the API request:
```bash
curl -X POST http://localhost:8000/api/crawl \
     -H "Content-Type: application/json" \
     -d '{"url": "https://en.wikipedia.org/wiki/Black_hole", "bot_id": "test_agent_123"}'
```

If it works, the API will output exactly how many chunks of text it successfully embedded into Pinecone!
