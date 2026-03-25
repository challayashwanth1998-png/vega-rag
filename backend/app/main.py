from fastapi import FastAPI

app = FastAPI(title="RAG Agent API")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running!"}
