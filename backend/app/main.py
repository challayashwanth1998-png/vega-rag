from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import crawl, chat, agents

app = FastAPI(title="VegaRAG API")

# Allow Next.js dashboard to communicate with this Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect all the routes
app.include_router(crawl.router, prefix="/api", tags=["ingestion"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running!"}
