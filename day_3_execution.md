# Day 3 Execution Guide: Ingestion Storage & AI Foundations

Today, we are setting up the foundation for the "R" (Retrieval) in our RAG platform. We need a secure place to store uploaded PDFs, a Vector Database to store their "meaning", and we need to unlock Amazon's AI Models.

We will do this entirely through the UI so you can see exactly how the AI backend is wired together.

---

## Step 1: Create the Source Document S3 Bucket
When users drag-and-drop a PDF on your Next.js frontend, it will upload directly to AWS S3. 

1. Go to the AWS Console, search for **S3**, and click on it.
2. Click the orange **Create bucket** button.
3. **Bucket name**: Type a unique name like `vegarag-document-storage-yourname` (S3 bucket names must be globally unique across all of AWS).
4. **AWS Region**: Leave as `us-east-1`.
5. Scroll down to **Block Public Access settings for this bucket**. 
   * Leave **"Block all public access"** CHECKED. (We only want authenticated Cognito users uploading files securely!).
6. Scroll to the bottom and click **Create bucket**.

*We will configure the specific CORS rules for Next.js to talk to this bucket later when we build the Frontend drag-and-drop UI!*

---

## Step 2: Unlock Amazon Bedrock Intelligence (Nova / Titan)
Amazon restricts access to its LLMs to prevent abuse. You must explicitly request access to the models we plan to use.

1. Go to the AWS Console, search for **Bedrock**, and click on it.
2. On the very bottom left sidebar, click **Model access**.
3. Click the orange **Enable specific models** button.
4. Scroll down and find **Amazon** in the provider list. Check the box for:
   * **Titan Text Embeddings V2** (This turns PDFs into vectors).
   * **Amazon Nova Micro** (This is our hyper-fast, cheap chat model).
5. Scroll right to the bottom and click **Next**, then **Submit**.
*(Approval is usually instant!)*

---

## Step 3: Create the Pinecone Vector Database
AWS doesn't have a cheap serverless Vector DB, so we use Pinecone! This is where we will store the "brain" of the AI.

1. Open a new tab and go to **[Pinecone.io](https://app.pinecone.io/)** and sign up for a free account.
2. Once logged in, click **Create Index**.
3. **Name**: `vega-rag-index`
4. **Dimensions**: `1024` *(This is absolutely critical. Titan Embeddings V2 outputs exactly 1024 numbers. If this doesn't match, it will crash).*
5. **Metric**: `Cosine`
6. **Capacity Mode**: `Serverless` (Cloud: **AWS**, Region: **us-east-1**).
7. Click **Create Index**.

### Step 3B: Grab your Keys
1. On the Pinecone left sidebar, click **API Keys**.
2. Copy your string.

---

## Step 4: Save your Environment Variables

Just like Day 2, we need to inject our keys into the Python Backend so it can talk to Pinecone and S3!

Open `/Users/challa/Documents/vegaRAG/backend/.env` and add these **3 new lines** to the bottom:

```env
# Day 3: Ingestion & AI Keys
S3_DOCUMENT_BUCKET=vegarag-document-storage-yourname
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_INDEX_NAME=vega-rag-index
```

Once you've clicked through the UI and updated your `.env` file, let me know, and we will actually write the Python logic (`backend/lambdas/ingest_file.py`) that chunks the PDFs into Pinecone!
