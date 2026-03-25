# Day 1 Execution Guide: Project Scaffolding & CI/CD Foundations

Today, we will build the foundation of the monorepo, initializing the three core applications (Frontend, Backend, and the Widget) and setting up the CI/CD GitHub Actions pipelines. 

Open your terminal in `/Users/challa/Documents/vegaRAG` and follow these steps.

---

## Step 1: Initialize the Monorepo
First, let's make sure we have a clean Git repository at the root of our project.
```bash
cd /Users/challa/Documents/vegaRAG
git init
echo "node_modules/\n.env\n__pycache__/\nvenv/\n.next/" > .gitignore
git add .gitignore
git commit -m "Initialize monorepo"
```

---

## Step 2: Scaffold the Next.js Frontend
We will use `create-next-app` to set up the dashboard application with Tailwind CSS, TypeScript, and ESLint securely configured.

```bash
# In the vegaRAG directory, run:
npx create-next-app@latest frontend
```
*When prompted, select the following:*
* **TypeScript:** Yes
* **ESLint:** Yes
* **Tailwind CSS:** Yes
* **`src/` directory:** Yes
* **App Router:** Yes
* **Customize import alias:** No (default `@/*`)

Once installed, verify it works:
```bash
cd frontend
npm run dev
# Visit http://localhost:3000 to ensure the starter page loads, then press Ctrl+C to stop.
cd ..
```

---

## Step 3: Scaffold the FastAPI Backend
Next, we will set up the Python backend environment for LangGraph and our agents.

```bash
# In the vegaRAG directory, run:
mkdir backend
cd backend

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# Create the initial folder structure
mkdir -p app/api/routers app/core app/services app/agent tests

# Create the Requirements file
cat << 'EOF' > requirements.txt
fastapi
uvicorn
pydantic
boto3
langgraph
langchain-aws
pytest
python-dotenv
EOF

# Install the dependencies
pip install -r requirements.txt

# Create a simple Hello World API to test
cat << 'EOF' > app/main.py
from fastapi import FastAPI

app = FastAPI(title="RAG Agent API")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running!"}
EOF

# Test that it works
uvicorn app.main:app --reload
# Visit http://localhost:8000 to see {"status": "ok"}, then press Ctrl+C to stop.
cd ..
```

---

## Step 4: Scaffold the Preact Widget
We need a tiny, lightweight workspace to compile our embeddable Javascript `<script>` tag. Vite + Preact is the best tool for this.

```bash
# In the vegaRAG directory, run:
npm create vite@latest widget -- --template preact
cd widget
npm install
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Test the widget server
npm run dev
# Visit the localhost port provided, then Ctrl+C
cd ..
```

---

## Step 5: Setup CI/CD (GitHub Actions)
Finally, we will create the pipeline files that will tell GitHub how to automatically deploy this code later.

```bash
# Create the GitHub workflows directory
mkdir -p .github/workflows
```

**1. Create the Frontend Workflow:**
Create a file at `.github/workflows/frontend-deploy.yml`:
```yaml
name: Deploy Next.js Frontend Next
on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      # Deployment step to Vercel/AWS will be added here on Day 13
```

**2. Create the Backend Workflow:**
Create a file at `.github/workflows/backend-deploy.yml`:
```yaml
name: Build Backend Docker Image
on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest
      # Docker build & push to AWS ECR will be added here on Day 13
```

---

## Day 1 Complete!
If you have run all these steps successfully, run:
```bash
git add .
git commit -m "Day 1 Complete: Scaffolded Frontend, Backend, Widget, and CI/CD pipelines"
```

Let me know if you run into any issues executing this guide, or if you want me to run these terminal commands automatically for you!
