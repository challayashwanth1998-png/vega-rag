# ==========================================
# FastAPI Backend Dockerfile (AWS Fargate Ready)
# ==========================================
FROM python:3.11-slim

# Set strict environmental guarantees for secure execution
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install System Requirements for underlying vector database operations if needed eventually
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Optimize layer caching by moving dependency installation upstream
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Migrate source infrastructure
COPY . .

# Expose Uvicorn Binding port
EXPOSE 8000

# Strict entrypoint
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
