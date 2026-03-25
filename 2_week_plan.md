# The Master 14-Day Blueprint: Enterprise RAG Chat Agent SaaS
*(A Mendable / Chatbase Clone)*

This document serves as the architectural master plan. Every day contains the specific files, configurations, and AWS setup required to build a highly scalable, multi-tenant AI company from scratch.

---

## Technical Stack Definition
* **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion (animations), AWS Amplify Auth, Recharts (for Usage line graphs).
* **Embeddable Component**: Preact + Tailwind (compiled to a single `widget.js` bundle served via CloudFront).
* **Backend API API**: Python 3.11, FastAPI, Pydantic, Boto3, LangChain/LangGraph.
* **AI & Search**: Amazon Bedrock (Nova Micro), Pinecone Serverless Vector DB.
* **Database & Storage**: Amazon DynamoDB (Single-Table Design), Amazon S3 (Isolated Buckets).
* **Compute & Hosting**: GitHub Actions (CI/CD) -> AWS ECR -> AWS ECS Fargate & AWS Lambda. Vercel for the Next.js frontend.

---

## 📅 Sprint 1: Inference Engine, Data Sync & The "Action" Agent

### Day 1: Project Scaffolding & CI/CD Foundations
**Goal:** Establish the monorepo, linting rules, and automated build pipelines.
* **Components to Build:**
  * Initialize `/frontend` (Next.js) with ESLint & Prettier.
  * Initialize `/backend` (FastAPI) with `requirements.txt` and `pytest`.
  * Initialize `/widget` (Preact setup for the embed script).
* **DevOps Tasks:**
  * Create `.github/workflows/backend-deploy.yml` (Builds FastAPI Docker image and pushes to AWS ECR).
  * Create `.github/workflows/frontend-deploy.yml` (Deploys Next.js to Vercel/CloudFront).
* **Checklist/Gotcha:** Ensure GitHub Secrets are provisioned for AWS credentials.

### Day 2: Identity & Multi-Tenant Database Architecture
**Goal:** Provision user authentication and the NoSQL schema needed to separate tenant data perfectly.
* **AWS Infrastructure:**
  * Create **AWS Cognito User Pool**. Enable Email/Password and Google OAuth login.
  * Create **DynamoDB Table** named `PlatformDB` with Partition Key (`PK`) and Sort Key (`SK`).
* **Database Schema Enforcement:**
  * `PK: USER#<user_id> | SK: PROFILE` (User subscription details. Includes `credits_used` limit of 50).
  * `PK: WORKSPACE#<user_id> | SK: USAGE_HISTORY#<date>` (For line graphs on the Usage page).
  * `PK: BOT#<bot_id> | SK: METADATA` (Bot avatar, colors, system prompts, specific chat widget configurations).
  * `PK: BOT#<bot_id> | SK: SOURCE#<source_id>` (Training data status: PDF, URL).
  * `PK: CHAT#<session_id> | SK: MSG#<timestamp>` (Chat logs for analytics).

### Day 3: Ingestion Pipeline 1 - Document Parsing (S3 + Lambda)
**Goal:** Securely accept PDFs/TXTs, parse them, chunk them, embed, and put them in Pinecone.
* **AWS Infrastructure:**
  * Create **S3 Bucket** (`rag-document-storage`) with strict CORS rules for frontend upload.
  * Setup **S3 Event Notification** triggering a Lambda function.
* **Components to Build:**
  * `backend/lambdas/ingest_file.py`: An AWS Lambda handler.
  * Logic: Triggered on S3 upload -> Download file -> Extract text (PyMuPDF) -> Markdown chunking (RecursiveCharacterTextSplitter) -> Call Amazon Bedrock `Titan Embeddings v2` -> Upsert to **Pinecone** using `namespace=bot_id`. Update DynamoDB status to "Trained".

### Day 4: Ingestion Pipeline 2 - URL Crawling & Data Sync
**Goal:** Allow entering website URLs and extracting massive text seamlessly.
* **Components to Build:**
  * `backend/app/api/routers/crawl.py`: FastAPI endpoint accepting a URL.
  * `backend/app/services/scraper.py`: Logic using BeautifulSoup / Firecrawl to scrape a page, clean HTML, extract main article text.
  * *Integration logic:* Pass scraped text into the exact same Chunking -> Embedding -> Pinecone pipeline built on Day 3.
* **Advanced Feature:** Add logic to detect `sitemap.xml` and enqueue background scraping for the entire website.

### Day 5: The "Action" Agent API (LangGraph Core)
**Goal:** The heart of the product. The AI that talks back and searches Pinecone.
* **Components to Build:**
  * `backend/app/agent/graph.py`: Define a LangGraph `StateGraph`.
  * **Node 1 (Retriever)**: Search Pinecone `namespace=bot_id` for context.
  * **Node 2 (Tool/Action Check)**: Give the LLM access to external APIs (e.g., "Lookup Order API"). Decide if a tool is needed.
  * **Node 3 (Generator)**: Pass the retrieved Pinecone chunks + Bot's Custom System Prompt + User Query to Bedrock Nova Micro.
* **API Details:** Create `POST /chat/stream` which yields Server-Sent Events (SSE) so the frontend can stream tokens character-by-character.

### Day 6: Agent Security & Continuous Training Loops
**Goal:** Bulletproof security, enforce credit limits, and allow admins to correct the AI.
* **Components to Build:**
  * `backend/app/middleware/auth.py`: Validate JWT tokens from Cognito. Ensure user `x` cannot query bot `y`.
  * **Credit Limiting**: In `auth.py`, track each incoming query and increment the DynamoDB `credits_used` counter. If `credits_used >= 50`, return a 403 Forbidden to stop chat generation.
  * `backend/app/api/routers/training.py`: Build endpoints that retrieve chat logs, allow an admin to mark an AI response as "Incorrect," and write the admin's rewritten response to a special Pinecone metadata tag or DynamoDB to enforce the correct answer next time.

### Day 7: Week 1 Polish & Integration Testing
**Goal:** Ensure the backend monolith works perfectly before building UI.
* **Tasks:**
  * Write Pytest scripts.
  * Test Flow: Create User -> Create Bot ID -> Mock S3 Upload -> Verify Vector in Pinecone -> Send Chat API request -> Stream response with correct RAG context.
  * Fix all Bedrock IAM Role permissions.

---

## 📅 Sprint 2: Web Dashboards, Omnichannel Widgets & SaaS Launch

### Day 8: Workspace Global Layer & Agents Grid
**Goal:** Setup the Next.js global layout and the main landing page showing a user's bots.
* **Components to Build:**
  * `frontend/app/layout.tsx`: Left sidebar showing `Agents`, `Usage`, `Workspace settings`. Includes the "0 / 50 Credits" progress block.
  * `frontend/app/agents/page.tsx`: Grid of bot cards showing an image of the widget, the bot's name, and a "Last trained {x} ago" status.

### Day 9: Workspace Analytics (The Usage Page)
**Goal:** Build the specific usage charts shown in the screenshots based on your DynamoDB metrics.
* **Components to Build:**
  * `frontend/app/usage/page.tsx`:
    * Two circular/donut charts: `X / 50 Credits used` and `Y / Z Agents used`.
    * A large Recharts.js line graph named `Usage history` pulling the per-day invocation counts from DynamoDB.
    * A list at the bottom named `Credits used per agent` to see which bots are active.

### Day 10: Deep-Dive Agent Menus & Interactive Playground
**Goal:** The split-screen UI for prompt engineering and live testing.
* **Components to Build:**
  * `frontend/app/agents/[bot_id]/layout.tsx`: Swaps the sidebar to bot-specific links: `Playground`, `Activity`, `Analytics`, `Data sources`, `Actions`, `Contacts`, `Deploy`, `Settings`.
  * `frontend/app/agents/[bot_id]/playground/page.tsx`: 
    * **Left Panel**: Training Status badge, Model Dropdown (e.g. GPT-5.1 alias), explicit button for "AI Actions", and a large expandable textarea for "Instructions (System prompt)" formatted with `### Role`.
    * **Right Panel**: A live iPhone-sized Chat Preview. **This is fully interactive.** Users can type messages into the text box, hitting the actual LangGraph backend API from Day 5, receiving real SSE streaming responses backed by their Pinecone vectors.

### Day 11: Data Sources & "Deploy" Hub
**Goal:** File uploads and the deployment channels gateway.
* **Components to Build:**
  * `frontend/app/agents/[bot_id]/sources/page.tsx`: Drag-and-drop file uploader (direct to S3) and Website URLs URL crawler input.
  * `frontend/app/agents/[bot_id]/deploy/page.tsx`: The "All channels" grid UI displaying integration routes.
    * Grid Cards: "Chat widget" (contains On/Off toggle and Manage btn), "Help page", "Email", "Slack" (shows Lock icons for upgrades), "WordPress".

### Day 12: Widget Customization Interface & Javascript Bundle
**Goal:** The deep-dive screen for customizing the embeddable chat widget & its compiled output.
* **Components to Build:**
  * `frontend/app/agents/[bot_id]/deploy/chat-widget/page.tsx`: 
    * Top Navigation Tabs: `Content`, `Style`, `AI`, `Embed`.
    * View logic: Allow text inputs for `Display name`, multiline `Initial messages`, and dynamic arrays to add `Suggested messages`.
    * The Left Panel holds inputs, rendering real-time UI updates to the Right Panel Chat Preview.
  * **The Widget Bundle (`widget/src/index.js`)**: Create a Preact component mirroring the Playground chat UI. It must fetch its specific `Initial messages`, colors, and icons dynamically from the backend `GET /widget/config` before rendering to the DOM. Setup Webpack/Vite to output a single `widget.min.js` to S3/CloudFront.

### Day 13: Activity Logs & Final Backend Security
**Goal:** Allow users to read past human conversations with their bot.
* **Components to Build:**
  * `frontend/app/agents/[bot_id]/activity/page.tsx`: Feed of user chats allowing bot owners to audit responses.
* Finalize ECS Fargate Auto-scaling rules and API Gateway CORS restrictions so users widgets only run on authorized domains.

### Day 14: System End-to-End Walkthrough & Launch
**Goal:** Test every flow from the user perspective.
* Upload 5 URLs to a bot -> Tune the System Prompt in Playground -> Verify it works instantly in the right-hand live chat pane -> Go to Deploy -> Chat Widget Manager -> Add three "Suggested message" buttons and change colors -> Grab the `<script>` tag -> Embed on a test HTML page and test the connection.
* Check the Usage Dashboard to ensure credits incremented correctly on the Line Graph.
* Launch.
