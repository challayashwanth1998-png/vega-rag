"use client";
import Link from "next/link";
import React from "react";
import {
  Bot, ArrowRight, Database, Zap, Shield, Server, MessageSquare, Cloud,
  CheckCircle2, Lock, Route, Network, Cpu, Layers, GitBranch, BarChart3, Boxes
} from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";

function Badge({ color, text }: { color: string; text: string }) {
  const cls: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200",
    orange: "text-orange-600 bg-orange-50 border-orange-200",
    slate: "text-slate-600 bg-slate-100 border-slate-200",
    red: "text-red-600 bg-red-50 border-red-200",
    violet: "text-violet-600 bg-violet-50 border-violet-200",
  };
  return (
    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider inline-block ${cls[color] || cls.slate}`}>
      {text}
    </span>
  );
}

function Bullet({ color = "blue", children }: { color?: string; children: React.ReactNode }) {
  const cls: Record<string, string> = {
    blue: "text-blue-500", emerald: "text-emerald-500", purple: "text-purple-500",
    orange: "text-orange-500", slate: "text-slate-400", red: "text-red-500", violet: "text-violet-500",
  };
  return (
    <li className="flex gap-3 text-sm text-slate-600 leading-relaxed">
      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cls[color] || cls.blue}`} />
      <span>{children}</span>
    </li>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-black text-slate-400 uppercase tracking-wider w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-700 font-medium leading-relaxed">{value}</span>
    </div>
  );
}

function Section({ id, badge, color, title, subtitle, children }: any) {
  return (
    <section id={id} className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-100 scroll-mt-20">
      <div className="mb-10">
        <Badge color={color} text={badge} />
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mt-4 mb-3">{title}</h2>
        <p className="text-lg text-slate-500 font-medium max-w-3xl leading-relaxed">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function DetailCard({ title, children, dark = false }: { title: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-6 ${dark ? "bg-slate-900 text-white" : "bg-white border border-slate-200"}`}>
      <h4 className={`font-black text-base mb-4 ${dark ? "text-slate-200" : "text-slate-900"}`}>{title}</h4>
      {children}
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900 selection:bg-blue-100">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <Badge color="blue" text="Technical Deep Dive" />
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mt-6 mb-6">
          Full Technical<br /><span className="text-blue-600">Breakdown.</span>
        </h1>
        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto mb-10">
          Every component, data flow, design decision, and architectural trade-off explained in precise detail — from DNS resolution to Bedrock token streaming.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            ["#aws-infra", "AWS Infrastructure"],
            ["#langgraph", "LangGraph Agent"],
            ["#rag-pipeline", "RAG Pipeline"],
            ["#sql-engine", "Postgres Data Warehouse"],
            ["#security", "Enterprise Guardrails"],
            ["#streaming", "SSE Streaming"],
            ["#dynamodb", "DynamoDB Schema"],
            ["#observability", "OpenTelemetry Tracing"],
            ["#chat-ui-proxy", "Chat UI Proxy"],
          ].map(([href, label]) => (
            <a key={href} href={href}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition">
              {label}
            </a>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          1. AWS INFRASTRUCTURE
      ══════════════════════════════════════════════════════════ */}
      <Section id="aws-infra" badge="Infrastructure" color="slate" title="AWS Cloud Infrastructure"
        subtitle="Three independent ECS Fargate services sit behind a single Application Load Balancer. Traffic is split by URL path prefix — no EC2 instances, no SSH access, no hardcoded credentials anywhere in the stack.">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <DetailCard title="ALB Listener Rules — How Traffic Is Split" dark>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              The ALB has a single HTTPS listener on port 443 with three forwarding rules evaluated in strict priority order. When a request arrives, the ALB walks through the rules top-to-bottom and sends the request to the first matching target group.
            </p>
            <div className="space-y-3">
              {[
                { priority: "Priority 1", path: "/api/*", target: "TG-Backend (port 8000)", color: "text-emerald-400", note: "FastAPI — handles all AI, ingestion, and config API calls" },
                { priority: "Priority 2", path: "/chat/*", target: "TG-ChatUI (port 3001)", color: "text-violet-400", note: "Next.js Chat UI — serves the chat interface and its proxy routes" },
                { priority: "Priority 3", path: "/*", target: "TG-Frontend (port 3000)", color: "text-blue-400", note: "Default catch-all — Next.js dashboard, landing page, all marketing pages" },
              ].map(({ priority, path, target, color, note }) => (
                <div key={path} className="bg-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-slate-500 text-[10px] font-black uppercase w-20 flex-shrink-0">{priority}</span>
                    <code className="text-yellow-400 font-mono text-sm font-bold">{path}</code>
                    <span className={`text-sm font-bold ml-auto ${color}`}>→ {target}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] pl-20">{note}</p>
                </div>
              ))}
            </div>
          </DetailCard>

          <div className="space-y-4">
            {[
              {
                icon: Route, title: "Route 53 + ACM (TLS)",
                desc: "The custom domain resolves via Route 53 Alias record pointing directly at the ALB DNS name. An ACM wildcard certificate covers *.vegarag.com and is auto-attached to the HTTPS listener. Renewal is fully automatic — no manual certificate rotation. HTTP on port 80 is permanently redirected to HTTPS at the ALB layer, so no plaintext traffic ever reaches a container.",
                color: "orange"
              },
              {
                icon: Shield, title: "VPC + Security Groups",
                desc: "All three Fargate tasks share one security group. Inbound rules allow ports 80 and 443 (ALB), plus 3000, 3001, and 8000 for ALB health check probes. No direct public internet access to container ports — all traffic flows through the ALB. Tasks use 'assignPublicIp: ENABLED' purely so they can pull images from ECR over the internet gateway; no inbound connections can initiate to the task directly.",
                color: "slate"
              },
              {
                icon: Cloud, title: "Fargate + ECR",
                desc: "Each service has its own ECR repository. On deploy, the Docker image is built locally, pushed to ECR, and a new ECS task definition revision is registered. ECS then performs a rolling update — spinning up the new task, waiting for ALB health checks to pass, then draining and killing the old task. Zero-downtime deployments by default.",
                color: "blue"
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-slate-200">
                <h4 className="font-black text-slate-900 text-sm mb-2">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-7 border border-blue-100">
          <h4 className="font-black text-slate-900 mb-4">Task Definition Specs</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Backend", specs: [["CPU", "512 vCPU units"], ["Memory", "1024 MB"], ["Port", "8000"], ["IAM Role", "ecsTaskExecutionRole (Bedrock, DynamoDB, S3, ECR)"], ["Health Check", "GET /health → 200 OK"], ["Log Group", "/ecs/vegarag-backend"]] },
              { name: "Frontend", specs: [["CPU", "256 vCPU units"], ["Memory", "512 MB"], ["Port", "3000"], ["IAM Role", "ecsTaskExecutionRole (ECR pull only)"], ["Health Check", "GET / → 200 OK"], ["Log Group", "/ecs/vegarag-frontend"]] },
              { name: "Chat UI", specs: [["CPU", "512 vCPU units"], ["Memory", "1024 MB"], ["Port", "3001"], ["IAM Role", "ecsTaskExecutionRole (ECR pull only)"], ["Health Check", "GET /chat → 200 OK"], ["Log Group", "/ecs/vegarag-chat-ui"]] },
            ].map(({ name, specs }) => (
              <div key={name} className="bg-white rounded-xl p-5 border border-blue-100">
                <div className="font-black text-slate-900 mb-3">{name} Service</div>
                {specs.map(([label, val]) => (
                  <div key={label} className="flex justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-slate-400 font-semibold">{label}</span>
                    <span className="text-slate-700 font-bold text-right max-w-[60%]">{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
          2. LANGGRAPH STATEGRAPH
      ══════════════════════════════════════════════════════════ */}
      <Section id="langgraph" badge="Orchestration" color="emerald" title="LangGraph StateGraph Agent"
        subtitle="Every chat request runs through a compiled LangGraph StateGraph — a directed acyclic graph of nodes and conditional edges. State flows through nodes as an immutable TypedDict, making the agent fully deterministic and debuggable.">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <DetailCard title="What GraphState Contains">
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Every node in the graph reads from and writes to a shared state object. This state is passed forward through the graph — no global variables, no shared memory between requests. Each chat invocation gets its own isolated state.
            </p>
            <ul className="space-y-3">
              {[
                { field: "query", desc: "The raw user message as typed in the chat input." },
                { field: "bot_id", desc: "Which agent is responding — determines which Pinecone namespace, system prompt, and DynamoDB records to use." },
                { field: "session_id", desc: "Identifies the conversation thread — used to group activity records for history." },
                { field: "intent", desc: "Populated after the intent router runs: exactly one of 'casual', 'rag', or 'sql'." },
                { field: "retrieved_context", desc: "Populated by the RAG retriever — the top-5 document chunks concatenated as a single string." },
                { field: "sql_result", desc: "Populated by the SQL executor — the DuckDB query result formatted as a markdown table." },
                { field: "final_response", desc: "Set after Bedrock response generation — the full streamed AI reply." },
              ].map(({ field, desc }) => (
                <div key={field} className="bg-slate-50 rounded-xl p-3">
                  <code className="text-blue-700 font-mono text-xs font-black">{field}</code>
                  <p className="text-slate-500 text-xs mt-1">{desc}</p>
                </div>
              ))}
            </ul>
          </DetailCard>

          <div className="space-y-5">
            <DetailCard title="The 5-Node Graph Topology">
              <div className="space-y-4">
                {[
                  { step: "START", title: "Entry", color: "bg-slate-600", desc: "LangGraph's built-in START node. Receives the initial state and immediately passes it to the intent router. No logic here — just the graph entry point." },
                  { step: "01", title: "Intent Router Node", color: "bg-purple-600", desc: "Calls Bedrock Nova Lite with the user's query and a strict JSON schema. The LLM must return exactly one of three intents. Uses temperature=0 for maximum determinism. No hallucination risk — the schema enforces the output format." },
                  { step: "→", title: "Conditional Edge", color: "bg-orange-500", desc: "A routing function reads the intent from state and returns a node name as a string. LangGraph uses this to decide the next node. This is the only branching point in the entire graph." },
                  { step: "02a", title: "RAG Retriever Node", color: "bg-emerald-600", desc: "Only runs if intent='rag'. Embeds the query with Titan v2, queries Pinecone, and appends the top-5 chunks to state as retrieved_context." },
                  { step: "02b", title: "SQL Executor Node", color: "bg-orange-600", desc: "Only runs if intent='sql'. Fetches table schemas from DynamoDB, asks Nova Lite to generate DuckDB SQL, executes it against the S3 CSV via HTTPFS, and appends the result table to state." },
                  { step: "03", title: "Response Generation Node", color: "bg-blue-600", desc: "All three branches converge here. Injects context (RAG chunks or SQL table, or nothing for casual) into the Bedrock Nova Pro prompt via XML <context> markers and streams tokens back via SSE." },
                ].map(({ step, title, color, desc }) => (
                  <div key={step} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg ${color} text-white text-xs font-black flex items-center justify-center flex-shrink-0`}>{step}</div>
                    <div>
                      <div className="font-black text-slate-900 text-sm">{title}</div>
                      <p className="text-slate-500 text-xs leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DetailCard>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-8">
          <h3 className="font-black text-slate-200 mb-5">Why LangGraph Instead of a Simple if/else Chain?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Deterministic Execution", desc: "LangGraph compiles the graph into a static execution plan. Every run follows the same deterministic path based on state — no hidden branching, no surprise side effects between requests." },
              { title: "Observability", desc: "Each node and edge is instrumented. LangSmith can trace every invocation — which node ran, what state looked like entering and exiting, how long each step took. Critical for debugging production issues." },
              { title: "Extensibility", desc: "Adding a new capability (e.g., a web search node) requires adding one node and one conditional edge. No need to refactor the entire flow — the graph handles routing." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-slate-800 rounded-2xl p-5">
                <div className="font-black text-slate-200 mb-2 text-sm">{title}</div>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
          3. RAG PIPELINE
      ══════════════════════════════════════════════════════════ */}
      <Section id="rag-pipeline" badge="Retrieval" color="emerald" title="RAG Ingestion + Retrieval Pipeline"
        subtitle="Every agent gets its own isolated Pinecone namespace. Documents are chunked, embedded with Amazon Titan v2, and upserted at ingestion time. At query time, the user's question is embedded and compared against all stored vectors using approximate nearest-neighbour search.">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-black text-slate-900 mb-4">Ingestion — How Documents Enter the System</h3>
            <div className="space-y-4">
              {[
                { step: "1", title: "Source Loading", desc: "URLs are extracted with LangChain's WebBaseLoader (BeautifulSoup under the hood — strips JS-rendered noise, extracts article body). PDFs are processed with PyPDFLoader which preserves paragraph structure across page boundaries. CSVs and Excel files skip the RAG pipeline entirely and go to the SQL engine instead." },
                { step: "2", title: "Text Chunking", desc: "Documents are split using RecursiveCharacterTextSplitter with chunk_size=1000 characters and chunk_overlap=200. The splitter tries paragraph boundaries first (\\n\\n), then line breaks, then sentence endings, then word boundaries — working from biggest to smallest separator until chunks fit. The 200-character overlap preserves context across chunk edges." },
                { step: "3", title: "Embedding Generation", desc: "Each chunk is separately passed to Amazon Titan Embed Text v2 via Bedrock. The model returns a 1536-dimensional dense vector — each dimension is a float32 value capturing a different semantic feature of the text. Titan v2 supports an 8,192 token input window, so even large chunks fit in a single embedding call." },
                { step: "4", title: "Pinecone Upsert", desc: "Vectors are upserted to Pinecone Serverless in batches. Each vector includes the raw chunk text and source URL as metadata. The namespace parameter is always set to the bot_id — this physically partitions all vectors between agents. Cross-tenant retrieval is architecturally impossible regardless of what a prompt injection attack sends." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white text-sm font-black flex items-center justify-center flex-shrink-0">{step}</div>
                  <div>
                    <div className="font-black text-slate-900 text-sm mb-1">{title}</div>
                    <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-black text-slate-900 mb-4">Retrieval — How Context Is Found</h3>
            <div className="space-y-4">
              {[
                { step: "1", title: "Query Embedding", desc: "The user's raw query string is sent to Titan Embed Text v2 through the same pipeline as ingestion. This produces a 1536-dim query vector in the exact same vector space as the stored document vectors — a prerequisite for meaningful similarity comparison." },
                { step: "2", title: "ANN Search", desc: "Pinecone runs Approximate Nearest Neighbour (ANN) search using the HNSW algorithm. HNSW builds a hierarchical graph of vectors at index time and traverses it at query time — achieving sub-50ms p99 latency even at millions of vectors by trading a tiny amount of recall for massive speed gains over exact brute-force search." },
                { step: "3", title: "Top-K Selection", desc: "Pinecone returns the 5 most similar vectors by cosine similarity score. Top-5 is deliberately small — sending too much context fills the Bedrock prompt context window and causes the LLM to 'average' the information instead of focusing on the most relevant chunks. 5 chunks at ~1000 chars each = ~5,000 chars of context." },
                { step: "4", title: "Context Assembly", desc: "The 5 retrieved chunk texts are joined with a '---' separator and set as retrieved_context in the graph state. The response generation node then wraps this in <context>...</context> XML tags when constructing the Bedrock prompt — a clear structural signal to the LLM that this is external reference material, not part of the conversation." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white text-sm font-black flex items-center justify-center flex-shrink-0">{step}</div>
                  <div>
                    <div className="font-black text-slate-900 text-sm mb-1">{title}</div>
                    <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
              <h4 className="font-black text-slate-900 mb-3 text-sm">Technical Specs</h4>
              <div className="space-y-0">
                <SpecRow label="Embedding Model" value="Amazon Titan Embed Text v2 (amazon.titan-embed-text-v2:0)" />
                <SpecRow label="Vector Dimension" value="1536 float32 values per vector" />
                <SpecRow label="Input Window" value="8,192 tokens per embedding call" />
                <SpecRow label="Similarity Metric" value="Cosine similarity (angle between vectors, not magnitude)" />
                <SpecRow label="Index Type" value="HNSW — Hierarchical Navigable Small World graph" />
                <SpecRow label="Retrieval Latency" value="Sub-50ms p99 for indexes up to 10M vectors" />
                <SpecRow label="Tenant Isolation" value="Pinecone namespace = bot_id, enforced on every query" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
          4. TEXT-TO-SQL ENGINE
      ══════════════════════════════════════════════════════════ */}
      <Section id="sql-engine" badge="Data Warehouse" color="orange" title="Enterprise Text-to-SQL with PostgreSQL"
        subtitle="RAG is fundamentally broken for aggregate math. When intent is classified as 'sql', VegaRAG generates SQL against the user's data and executes it securely in PostgreSQL using strict Row-Level Security (RLS).">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div className="space-y-5">
            <DetailCard title="Why RAG Fails for Numeric Questions">
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                RAG retrieves text chunks. For "What was total revenue in Q3?", it retrieves chunks mentioning revenue or Q3. Summing numbers scattered across text is something embedding similarity cannot do.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                SQL, by contrast, operates on actual numbers. A <code className="text-orange-600 font-mono text-xs">SUM(revenue) WHERE quarter='Q3'</code> query returns exact math — no inference, no hallucination.
              </p>
            </DetailCard>

            <DetailCard title="Row-Level Security (RLS) — The Multi-Tenant Barrier">
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                Executing LLM-generated SQL against a database is traditionally extremely dangerous. We use an Enterprise PostgreSQL Warehouse to solve this using RLS.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                Before any SQL executes, the backend runs a strict context setup command. Postgres RLS policies evaluate the tenant variable on every single query. Even if a prompt injection attack generates a malicious query, the database engine strictly drops all rows not belonging to that tenant before returning data.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                The Postgres connection is also strictly forced to read-only, completely neutralizing SQL injection attacks at the driver level.
              </p>
            </DetailCard>
          </div>

          <div className="space-y-5">
            <DetailCard title="Asynchronous S3 Data Ingestion">
              <ul className="space-y-3">
                {[
                  { title: "FastAPI BackgroundTasks", desc: "When users upload massive CSV or Excel files, the HTTP connection returns a '202 Accepted' instantly. The parsing, DataFrame conversion, and S3 upload happens in a decoupled background thread, preventing AWS ALB 60s timeouts." },
                  { title: "Automated Schema Extraction", desc: "During the background task, the file headers are read and types inferred. A schema map is saved to DynamoDB so the LLM knows exactly what columns exist when generating the SQL later." },
                  { title: "No ETL Pipeline Required", desc: "The data flows directly from the user's browser, into S3, and is securely mapped to their tenant ID in PostgreSQL — ready for immediate natural language querying." },
                ].map(({ title, desc }) => (
                  <div key={title} className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                    <div className="font-black text-slate-900 text-xs mb-1">{title}</div>
                    <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                ))}
              </ul>
            </DetailCard>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
          5. ENTERPRISE SECURITY GUARDRAILS
      ══════════════════════════════════════════════════════════ */}
      <Section id="security" badge="Guardrails" color="red" title="Zero-Trust Security & Guardrails"
        subtitle="VegaRAG intercepts user input and LLM output in real-time, masking PII before it reaches Bedrock and automatically rejecting AI hallucinations before they reach the user.">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <DetailCard title="Input Layer: Microsoft Presidio PII Redaction" dark>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Sending raw user prompts to external LLMs can leak Social Security Numbers, credit cards, or internal emails. VegaRAG runs Microsoft Presidio with a SpaCy NLP engine locally inside the container.
            </p>
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm text-slate-300">
              <span className="text-red-400">User:</span> My SSN is 123-45-678. What's my balance?<br/><br/>
              <span className="text-emerald-400">System intercept:</span> My SSN is <span className="bg-emerald-500/20 text-emerald-300 px-1 rounded">&lt;US_SSN&gt;</span>. What's my balance?
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mt-4">
              Bedrock never sees the SSN. This allows the platform to be fully compliant with SOC2 and GDPR without relying on third-party API promises.
            </p>
          </DetailCard>

          <DetailCard title="Output Layer: Dual-LLM Entailment Checks">
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              How do you prove a RAG system isn't hallucinating? VegaRAG implements a "Dual-LLM" architecture. After the primary Bedrock Nova Pro model streams an answer, a secondary, smaller Bedrock Micro model is triggered in the background.
            </p>
            <ul className="space-y-3">
              <Bullet color="red">It runs a strict "entailment check" comparing the generated answer against the retrieved Pinecone context.</Bullet>
              <Bullet color="red">If the Micro model detects facts in the answer that do not exist in the context, it flags the response as a Hallucination in the DynamoDB activity logs.</Bullet>
              <Bullet color="red">This automated MLOps evaluation prevents "vibes-based" testing and ensures strict accuracy enforcement.</Bullet>
            </ul>
          </DetailCard>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
          6. OBSERVABILITY & CACHING
      ══════════════════════════════════════════════════════════ */}
      <Section id="observability" badge="Observability" color="emerald" title="Telemetry, Caching & Rate Limiting"
        subtitle="A system is only enterprise-grade if you can monitor it, cache it, and protect it from noisy neighbors.">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <DetailCard title="Pinecone Semantic Caching">
            <p className="text-slate-500 text-sm leading-relaxed mb-3">
              Instead of paying for Bedrock tokens on every identical query, VegaRAG stores previous Q&A pairs in a separate Pinecone Cache index.
            </p>
            <p className="text-slate-500 text-sm leading-relaxed">
              When a user asks a similar question (cosine similarity &gt; 0.95), the system instantly returns the cached response in under 50ms. Token cost: $0.
            </p>
          </DetailCard>

          <DetailCard title="Token Bucket Rate Limiting">
            <p className="text-slate-500 text-sm leading-relaxed mb-3">
              Multi-tenant architecture is vulnerable to "noisy neighbors" who exhaust API quotas. We implemented a memory-based Token Bucket algorithm inside FastAPI.
            </p>
            <p className="text-slate-500 text-sm leading-relaxed">
              Each tenant gets a fixed capacity of tokens per minute. If they burst above it, they receive an HTTP 429 Too Many Requests, protecting the cluster without requiring Redis.
            </p>
          </DetailCard>

          <DetailCard title="OpenTelemetry Distributed Tracing">
            <p className="text-slate-500 text-sm leading-relaxed mb-3">
              VegaRAG outputs Structured JSON logs injected with <code className="text-emerald-600 font-mono text-[10px]">trace_id</code> and <code className="text-emerald-600 font-mono text-[10px]">span_id</code> values.
            </p>
            <p className="text-slate-500 text-sm leading-relaxed">
              When a request flows from the Next.js Proxy → FastAPI → Bedrock → Pinecone, AWS X-Ray builds a beautiful visual waterfall chart, isolating exact latency bottlenecks down to the millisecond.
            </p>
          </DetailCard>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
          5. SSE STREAMING
      ══════════════════════════════════════════════════════════ */}
      <Section id="streaming" badge="Real-time" color="blue" title="Server-Sent Events (SSE) Streaming"
        subtitle="Tokens stream from Amazon Bedrock into a FastAPI AsyncIterator, get re-wrapped by the Next.js proxy into LangGraph-format SSE events, and land in the browser DOM via the LangGraph React SDK — no buffering, instant time-to-first-token.">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div className="space-y-5">
            <DetailCard title="Step 1 — FastAPI SSE Response">
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                The FastAPI <code className="text-blue-600 font-mono text-xs">/api/chat</code> endpoint returns a <code className="text-blue-600 font-mono text-xs">StreamingResponse</code> with <code className="text-blue-600 font-mono text-xs">media_type="text/event-stream"</code>. This tells the HTTP client not to wait for the response body to complete before reading — it can consume each newline-delimited chunk as it arrives.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                Bedrock's <code className="text-blue-600 font-mono text-xs">invoke_model_with_response_stream</code> returns an EventStream object. FastAPI iterates this stream asynchronously — each iteration yields one chunk from Bedrock's token buffer. Each chunk contains a delta object with a "text" field containing one or more characters.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                Each token is immediately formatted as an SSE event: <code className="text-blue-600 font-mono text-xs">data: {'{"text": "token"}'}

</code>. A final <code className="text-blue-600 font-mono text-xs">data: [DONE]</code> event signals stream end. Response headers disable all caching and set <code className="text-blue-600 font-mono text-xs">Connection: keep-alive</code> to prevent ALB timeout during long responses.
              </p>
            </DetailCard>

            <DetailCard title="Step 2 — Next.js Proxy Re-wrap">
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                The LangGraph SDK doesn't know how to consume VegaRAG's raw SSE format — it expects a specific event type called <code className="text-blue-600 font-mono text-xs">values</code> containing a full LangGraph message array. The Next.js proxy bridges this gap.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                For every token received from the backend, the proxy constructs a new complete message array (human message + accumulated AI text so far), serialises it as JSON, and emits it as an SSE event with <code className="text-blue-600 font-mono text-xs">event: values</code>. Before the first token, it emits an <code className="text-blue-600 font-mono text-xs">event: metadata</code> with the run ID.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                This means the browser receives N events for N tokens — each containing the full accumulated message. The SDK's React hook updates its internal state on every event, triggering a React re-render that appends the new token to the DOM. The visual effect is identical to ChatGPT's streaming output.
              </p>
            </DetailCard>
          </div>

          <div className="space-y-5">
            <DetailCard title="Step 3 — LangGraph SDK React Hook">
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                The <code className="text-blue-600 font-mono text-xs">useStream</code> hook from <code className="text-blue-600 font-mono text-xs">@langchain/langgraph-sdk/react</code> manages the entire client-side streaming lifecycle. When the user submits a message, it: creates or reuses a thread ID, POSTs to the proxy's <code className="text-blue-600 font-mono text-xs">/runs/stream</code> endpoint, and opens a ReadableStream on the response body.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                The hook's internal reducer processes each incoming SSE event, merges the message array into the component's React state via an immutable update, and triggers a re-render. The UI component reads <code className="text-blue-600 font-mono text-xs">stream.messages</code> which updates after every token — React's batching ensures this doesn't cause 60fps jank even on fast streams.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                When the stream ends, the hook automatically fires a <code className="text-blue-600 font-mono text-xs">GET /threads/{'{id}'}/state</code> request to hydrate the final canonical message state from DynamoDB — ensuring tool call messages and metadata survive beyond the stream lifetime.
              </p>
            </DetailCard>

            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <h4 className="font-black text-slate-900 mb-4 text-sm">SSE Event Wire Format — 4 Event Types</h4>
              <div className="space-y-3">
                {[
                  { event: "metadata", timing: "First event, before any tokens", desc: "Carries the run_id (UUID). Used by the SDK to correlate this stream with a specific LangGraph run." },
                  { event: "values", timing: "Once per token (N events total)", desc: "Carries the full updated message array. The AI message content field grows by one token each event." },
                  { event: "error", timing: "On backend failure", desc: "Carries an error object. SDK surfaces this as an error toast in the UI and stops rendering." },
                  { event: "[DONE]", timing: "Last event in stream", desc: "Plain SSE data with literal string [DONE]. Signals the proxy to close the ReadableStream controller." },
                ].map(({ event, timing, desc }) => (
                  <div key={event} className="bg-white rounded-xl p-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-blue-700 font-mono text-xs font-black">{event}</code>
                      <span className="text-[10px] text-slate-400 font-semibold">{timing}</span>
                    </div>
                    <p className="text-slate-500 text-xs">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
          6. DYNAMODB SCHEMA
      ══════════════════════════════════════════════════════════ */}
      <Section id="dynamodb" badge="Database" color="purple" title="DynamoDB Single-Table Design"
        subtitle="Every piece of VegaRAG's persistent state — agents, configs, data sources, chat logs, and analytics — lives in one DynamoDB table. Composite primary keys enable O(1) access patterns with zero SQL joins.">

        <div className="mb-6 bg-purple-50 rounded-2xl p-6 border border-purple-100">
          <h4 className="font-black text-slate-900 mb-2">Why Single-Table Design?</h4>
          <p className="text-slate-600 text-sm leading-relaxed">
            DynamoDB charges for read and write capacity units — not joins. Multiple tables would require multiple round-trips to assemble related data. Single-table design co-locates all an agent's data under one physical partition, enabling a single Query call to fetch everything. The trade-off is that the key schema must be designed upfront to support all access patterns — no ad-hoc querying.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              color: "blue",
              pattern: "USER#{email}  /  AGENT#{bot_id}",
              access: "ListAgents: Query PK=USER#{email}, SK begins_with 'AGENT#'",
              fields: [
                ["bot_id", "Short unique identifier (bot_8159fbf0 — 8 hex chars of UUID4)"],
                ["name", "Human-readable agent name set at creation"],
                ["status", "Draft or Active — used to filter displayed agents"],
                ["createdAt", "ISO 8601 timestamp — used for newest-first sort in the dashboard"],
              ],
              detail: "One item per agent per user. The email is the Cognito identity that created the agent. All agent metadata lives here — the dashboard's agent list is a single DynamoDB Query on this PK with a SK prefix scan."
            },
            {
              color: "emerald",
              pattern: "AGENT#{bot_id}  /  CONFIG",
              access: "GetConfig: GetItem PK=AGENT#{id}, SK='CONFIG'  |  SaveConfig: PutItem (overwrites entire item)",
              fields: [
                ["system_prompt", "The full system-level instruction given to the LLM on every request"],
                ["brand_color", "Hex color used in embed widget styling (e.g. #2563eb)"],
                ["name", "Display name used in the chat window header"],
                ["chat_title", "Custom chat window title — overrides agent name if set"],
                ["chat_logo_url", "Direct URL to a PNG/SVG logo shown in the chat UI header"],
                ["welcome_message", "First message shown when the chat window opens with no history"],
              ],
              detail: "Single item per agent. PutItem with SK='CONFIG' overwrites the entire config atomically — no partial updates, no merge conflicts. GetItem is O(1) key lookup — no scan, no filter."
            },
            {
              color: "orange",
              pattern: "AGENT#{bot_id}  /  SOURCE#{type}#{identifier}",
              access: "ListSources: Query PK=AGENT#{id}, SK begins_with 'SOURCE#'  |  Delete: DeleteItem exact SK",
              fields: [
                ["SK format (URL)", "SOURCE#URL#https://docs.example.com/page"],
                ["SK format (PDF)", "SOURCE#PDF#{filename}.pdf"],
                ["SK format (TABLE)", "SOURCE#TABLE#{filename}.csv — also has a paired TABLE# schema record"],
                ["status", "'indexed' once Pinecone upsert completes, 'pending' during ingestion"],
                ["chunk_count", "Number of vector chunks written to Pinecone for this source"],
                ["ingestedAt", "Timestamp of successful ingestion"],
              ],
              detail: "One item per document. The full URL or filename is embedded in the SK so deletions are an exact-key lookup — no scan needed to find the record. TABLE sources have a second companion record at TABLE#{filename} which stores the column schema for SQL execution."
            },
            {
              color: "violet",
              pattern: "ACTIVITY#{bot_id}  /  ENTRY#{timestamp}#{session_id}",
              access: "GetActivity: Query PK=ACTIVITY#{id}, SK begins_with 'ENTRY#' — newest-first sort by SK",
              fields: [
                ["session_id", "UUID or browser-generated thread ID — groups all turns in one conversation"],
                ["user_msg", "Verbatim user question as typed"],
                ["ai_response", "Full accumulated AI response after stream ended"],
                ["intent", "Classified intent: casual, rag, or sql — used for analytics"],
                ["timestamp", "ISO 8601 — used for time-ordering and display in chat history sidebar"],
              ],
              detail: "One item per chat exchange (one human + one AI turn). The timestamp in the SK enables range-key time ordering — newest items sort last alphabetically which is then reversed in the application layer. Session grouping is done in Python by iterating items and grouping by session_id value."
            },
            {
              color: "pink",
              pattern: "STATS#{bot_id}  /  DAY#{YYYY-MM-DD}",
              access: "GetAnalytics: Query PK=STATS#{id}, SK begins_with 'DAY#' — sorted by date",
              fields: [
                ["query_count", "Atomic ADD increment on every chat request — no read-modify-write needed"],
                ["token_count", "Approximate Bedrock token usage — incremented after stream completes"],
              ],
              detail: "One item per agent per day. DynamoDB's ADD operation atomically increments numeric attributes without read-modify-write race conditions. The analytics chart queries the last 30 days by date range on the SK. No separate analytics database needed."
            },
          ].map(({ color, pattern, access, fields, detail }) => (
            <div key={pattern} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col gap-1">
                <code className={`font-mono text-sm font-black ${
                  color === "blue" ? "text-blue-700" : color === "emerald" ? "text-emerald-700" :
                  color === "orange" ? "text-orange-700" : color === "violet" ? "text-violet-700" : "text-pink-700"
                }`}>{pattern}</code>
                <span className="text-[11px] text-slate-400 font-mono">{access}</span>
              </div>
              <div className="p-6">
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{detail}</p>
                <div className="space-y-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                  {fields.map(([label, val]) => (
                    <div key={label} className="flex gap-4 px-4 py-2.5 border-b border-slate-100 last:border-0">
                      <code className="text-[11px] font-mono text-purple-700 font-black w-32 flex-shrink-0">{label}</code>
                      <span className="text-[11px] text-slate-500 leading-relaxed">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
          7. CHAT UI PROXY
      ══════════════════════════════════════════════════════════ */}
      <Section id="chat-ui-proxy" badge="Chat UI" color="violet" title="Chat UI Service & Protocol Proxy"
        subtitle="The Chat UI is a separate Next.js 15 app deployed as its own Fargate service on port 3001 with basePath='/chat'. Its primary role is bridging the LangGraph SDK's wire protocol to VegaRAG's REST API — not the UI itself.">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div className="space-y-5">
            <DetailCard title="Why Is This a Separate Service?">
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                The open-source LangGraph SDK (used for the streaming chat UI) expects a specific backend protocol: thread creation, runs/stream SSE events in a particular format, thread state hydration endpoints. VegaRAG's FastAPI backend was built independently and has a different REST API shape.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                Rather than rewrite either the SDK or the backend, the Chat UI service acts as a translation layer. Its Next.js API routes at <code className="text-violet-600 font-mono text-xs">/chat/api/langgraph/*</code> implement the exact interface the SDK expects, then translate each call into the appropriate VegaRAG API call.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                Being a separate service also enables independent scaling — if chat traffic spikes independently of the dashboard, only the Chat UI Fargate task needs more capacity, not the entire frontend.
              </p>
            </DetailCard>

            <DetailCard title="basePath — The Critical Routing Configuration">
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                Next.js has a <code className="text-violet-600 font-mono text-xs">basePath</code> configuration option that prefixes all routes with a path segment. With <code className="text-violet-600 font-mono text-xs">basePath: "/chat"</code>, a Next.js API route defined at <code className="text-violet-600 font-mono text-xs">/api/langgraph</code> is actually served at <code className="text-violet-600 font-mono text-xs">/chat/api/langgraph</code> externally.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mb-3">
                This is essential. Without basePath, the LangGraph SDK would make browser requests to <code className="text-violet-600 font-mono text-xs">vegarag.com/api/langgraph/*</code> — which the ALB routes to the backend, not the Chat UI proxy, causing 404s.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                With basePath, requests go to <code className="text-violet-600 font-mono text-xs">vegarag.com/chat/api/langgraph/*</code> — which the ALB's <code className="text-violet-600 font-mono text-xs">/chat/*</code> rule correctly routes to the Chat UI container where the proxy handles it. In local dev, basePath is disabled (the app is accessed directly at localhost:3001 with no prefix).
              </p>
            </DetailCard>
          </div>

          <div className="space-y-5">
            <DetailCard title="Proxy Route Translation Table">
              <div className="space-y-3">
                {[
                  { sdk: "GET  /info", translates: "Returns hardcoded {version: '1.0.0'} — just confirms the proxy is alive", type: "local" },
                  { sdk: "POST /threads", translates: "Generates a UUID thread_id and returns it — no backend call needed", type: "local" },
                  { sdk: "POST /threads/search", translates: "→ GET /api/agents/{id}/activity — groups by session_id, returns thread list for history sidebar", type: "backend" },
                  { sdk: "GET  /threads/{id}", translates: "Returns a synthetic thread object with idle status — no backend call", type: "local" },
                  { sdk: "GET  /threads/{id}/state", translates: "→ GET /api/activity/session/{id} — fetches all turns, rebuilds LangGraph message format with stable IDs", type: "backend" },
                  { sdk: "POST /threads/{id}/history", translates: "→ GET /api/activity/session/{id} — returns checkpoint array for history navigation", type: "backend" },
                  { sdk: "POST /threads/{id}/runs/stream", translates: "→ POST /api/chat — forward query, re-stream Bedrock tokens as LangGraph values SSE events", type: "backend" },
                ].map(({ sdk, translates, type }) => (
                  <div key={sdk} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-violet-700 font-mono text-[11px] font-black flex-1">{sdk}</code>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${type === "local" ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>
                        {type === "local" ? "handled locally" : "fwd to backend"}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{translates}</p>
                  </div>
                ))}
              </div>
            </DetailCard>

            <div className="bg-violet-50 rounded-2xl p-5 border border-violet-100">
              <h4 className="font-black text-slate-900 mb-3 text-sm">Message ID Stability — Why It Matters</h4>
              <p className="text-slate-500 text-xs leading-relaxed mb-2">
                When the LangGraph SDK finishes consuming a stream, it immediately calls <code className="text-violet-700 font-mono text-[11px]">GET /threads/{'{id}'}/state</code> to get the canonical final state. If the message IDs in this response differ from what was streamed, React sees new objects and re-renders the entire message list — causing tool call messages and structured outputs to visually disappear and reappear.
              </p>
              <p className="text-slate-500 text-xs leading-relaxed">
                VegaRAG solves this by deriving message IDs deterministically from the session_id and SK key rather than generating random UUIDs. The same formula runs during streaming and during state reconstruction — producing identical IDs so React's reconciler treats them as the same elements and skips re-render.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
          8. SECURITY MODEL
      ══════════════════════════════════════════════════════════ */}
      <Section id="security" badge="Security" color="red" title="Zero-Trust Security Model"
        subtitle="No hardcoded AWS credentials. No cross-tenant data leakage. All AWS auth via short-lived IAM session tokens. Bedrock inference stays inside the AWS backbone — never touches the public internet.">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[
            {
              icon: Lock, color: "red", title: "IAM Task Roles — No Static Keys",
              points: [
                "ECS Fargate tasks obtain temporary credentials through the EC2 Instance Metadata Service (IMDS) endpoint — a link-local HTTP address (169.254.169.254) accessible only from inside the task's network namespace.",
                "Credentials have a 15-minute TTL and are automatically rotated by AWS STS. The application never stores them — boto3 refreshes them transparently on expiry.",
                "The task role policy is scoped to exactly the services needed: Bedrock:InvokeModel, DynamoDB:Query/GetItem/PutItem/UpdateItem, S3:GetObject/PutObject, ECR:GetAuthorizationToken, logs:CreateLogStream/PutLogEvents.",
                "No AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY environment variables exist anywhere in the system — not in Docker images, task definitions, or CI/CD pipelines.",
              ]
            },
            {
              icon: Shield, color: "blue", title: "Cognito Authentication",
              points: [
                "The frontend dashboard is protected by Amazon Cognito. Every dashboard page check verifies a JWT RS256 access token issued by the Cognito User Pool.",
                "Tokens are signed with the User Pool's RSA private key and verified client-side against the public JWKS endpoint — no round-trip to Cognito required on every page load.",
                "The Cognito User Pool enforces email verification at sign-up. Optional MFA with TOTP authenticator apps is supported via Cognito's built-in MFA settings.",
                "Public-facing chat UI at /chat is intentionally unauthenticated — end users of a deployed chat widget should not need to create accounts just to chat.",
              ]
            },
            {
              icon: Database, color: "emerald", title: "Multi-Tenant Data Isolation",
              points: [
                "Pinecone namespace equals bot_id on every single query — hardcoded in the retrieval node, never derived from user input. A prompt injection attack that tries to set namespace='other_bot' cannot override this parameter.",
                "DynamoDB primary keys always include the bot_id segment (PK: AGENT#{bot_id}). The application never performs full table scans — every query is key-anchored to the specific agent, making cross-tenant reads structurally impossible.",
                "S3 objects are stored at s3://bucket/{bot_id}/{filename} — IAM prefix conditions can further restrict per-bot access if needed.",
                "CloudWatch log streams are keyed per ECS task — no log interleaving between tenants sharing the same container.",
              ]
            },
          ].map(({ icon: Icon, color, title, points }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                color === "red" ? "bg-red-50" : color === "blue" ? "bg-blue-50" : "bg-emerald-50"
              }`}>
                <Icon className={`w-5 h-5 ${
                  color === "red" ? "text-red-600" : color === "blue" ? "text-blue-600" : "text-emerald-600"
                }`} />
              </div>
              <h4 className="font-black text-slate-900 mb-4 text-sm">{title}</h4>
              <ul className="space-y-3">
                {points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-500 leading-relaxed">
                    <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                      color === "red" ? "text-red-500" : color === "blue" ? "text-blue-500" : "text-emerald-500"
                    }`} /> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-8">
          <h3 className="font-black text-slate-200 mb-4">Bedrock — Why AI Inference Never Hits the Public Internet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Every OpenAI, Anthropic, or Cohere API call your application makes traverses the public internet. The packet leaves your server, enters the public routing table, passes through multiple ISP hops, and arrives at the AI provider's data centre. At every hop, TLS provides confidentiality — but the provider still terminates TLS and processes your prompt in plaintext on their infrastructure. Your data is subject to their retention and training policies.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Amazon Bedrock is fundamentally different. When a VegaRAG Fargate task calls Bedrock's API, the packet travels from the container's ENI through the VPC router, across AWS's private fibre backbone, and into the Bedrock service endpoint — all within the same AWS region, all on private infrastructure. The packet never enters the public internet routing table. This is equivalent to a private network call, not an internet API call.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Data residency", value: "All inference stays within your selected AWS region. No data leaves the region boundary." },
                { label: "No training on your data", value: "AWS contractually guarantees Bedrock prompts and responses are not used to train foundation models." },
                { label: "VPC routing", value: "Traffic routes over AWS backbone fiber, not public internet. No TLS termination by third parties." },
                { label: "Audit trail", value: "All Bedrock API calls are logged in CloudTrail with full request metadata. Queryable by security team." },
                { label: "Compliance", value: "Bedrock is HIPAA eligible, SOC 1/2/3 compliant, and ISO 27001 certified — inherited by applications using it." },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-800 rounded-xl p-4">
                  <div className="text-slate-200 text-xs font-black mb-1">{label}</div>
                  <div className="text-slate-400 text-xs leading-relaxed">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-12 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-medium">
          <div className="flex items-center gap-2 font-bold text-slate-600">
            <Bot className="w-5 h-5 text-blue-600" /> VegaRAG — Technical Documentation
          </div>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-blue-600 transition">← Back to Home</Link>
            <Link href="/deploy" className="hover:text-blue-600 transition">Deploy Guide</Link>
            <Link href="/pricing" className="hover:text-blue-600 transition">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
