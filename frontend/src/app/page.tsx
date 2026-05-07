"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/Providers";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2, Zap, Database, Layers, Bot, Github, Terminal } from "lucide-react";
import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";

export default function HomePage() {
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900 selection:bg-blue-100">

      <MarketingNav />

      {/* ── Hero ── */}
      <main className="relative z-10">
        <section className="pt-20 pb-32 px-6 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Open-source · Self-host on AWS Fargate
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight text-slate-900 mb-8">
              The open-source platform<br />
              <span className="inline-block pt-3 text-blue-600 underline decoration-blue-500 decoration-4 underline-offset-8 font-black tracking-tighter uppercase italic">for AI chat agents.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto mb-12">
              Deploy intelligent RAG chat agents powered by your own data. Start for free on our managed cloud, or self-host natively inside your own AWS account.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {mounted && auth.isAuthenticated ? (
                <Link href="/agents"
                  className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white text-lg font-black rounded-2xl shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" /> Go to Dashboard
                </Link>
              ) : (
                <button onClick={() => auth.signinRedirect()}
                  className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white text-lg font-black rounded-2xl shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" /> Start Building
                </button>
              )}
              <Link href="/deploy"
                className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-200 text-slate-700 text-lg font-black rounded-2xl hover:border-slate-300 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                <Github className="w-5 h-5" /> Deploy Open Source
              </Link>
            </div>

            {/* Trust strip */}
            <div className="mt-14 flex flex-wrap justify-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {["Amazon Bedrock Nova", "PostgreSQL RLS", "Pinecone Semantic Cache", "Microsoft Presidio PII", "AWS Fargate"].map(t => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {t}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            HOW IT WORKS — Full Architecture Breakdown
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-28 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-black uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Full Stack Architecture
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-5">
              How VegaRAG Actually Works
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
              A production-grade RAG platform built on AWS Fargate, LangGraph StateGraph agents, Pinecone vector search, PostgreSQL Row-Level Security, and Amazon Bedrock Nova — guarded by Microsoft Presidio PII redaction and dual-LLM hallucination checks.
            </p>
          </div>

          {/* ── Layer 1: AWS Infrastructure ── */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black">AWS</div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Layer 1 — Cloud Infrastructure</h3>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: "Route 53 + ACM", color: "orange", badge: "DNS + TLS", desc: "Custom domain with HTTPS. SSL certificate auto-renewed via ACM. All traffic encrypted in transit end-to-end." },
                { title: "Application Load Balancer", color: "blue", badge: "ALB + Listener Rules", desc: "Single ALB handles all traffic via priority rules: /api/* → Backend, /chat/* → Chat UI, /* → Frontend." },
                { title: "ECS Fargate Cluster", color: "purple", badge: "3 Services", desc: "Serverless containers — no EC2 to manage. Auto-scales on demand, zero idle cost. Each service in its own task definition with separate IAM task roles." },
                { title: "VPC + Security Groups", color: "slate", badge: "Network Isolation", desc: "All services share one SG. Inbound: 80, 443, 3000, 3001, 8000. No hardcoded keys — IAM Instance Profile auth only." },
              ].map(({ title, color, badge, desc }) => (
                <div key={title} className={`bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-all duration-300 group`}>
                  <div className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block mb-3 uppercase tracking-wider ${
                    color === "orange" ? "text-orange-600 bg-orange-50" :
                    color === "blue" ? "text-blue-600 bg-blue-50" :
                    color === "purple" ? "text-purple-600 bg-purple-50" :
                    "text-slate-600 bg-slate-100"
                  }`}>{badge}</div>
                  <h4 className="font-black text-slate-900 text-sm mb-2">{title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center my-5">
            <div className="flex flex-col items-center">
              <div className="w-px h-8 bg-gradient-to-b from-slate-200 to-blue-400" />
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-400" />
            </div>
          </div>

          {/* ── Layer 2: Three Fargate Services ── */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black">ECS</div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Layer 2 — Three Fargate Microservices</h3>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Frontend */}
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-7 border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-xl transition-all">
                <div className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full inline-block mb-4 uppercase tracking-wider">Next.js 15 · Port 3000</div>
                <h4 className="text-lg font-black text-slate-900 mb-3">Frontend Dashboard</h4>
                <ul className="space-y-2">
                  {[
                    "AWS Cognito authentication (JWT + Refresh tokens)",
                    "Agent CRUD — create, configure, deploy agents",
                    "Data ingestion: URLs, PDFs, CSVs, plain text",
                    "Workflow Studio (ReactFlow visual canvas)",
                    "Analytics charts, chat logs, deploy embed codes",
                    "Settings: system prompt, brand color, chat UI branding (title + logo per agent)",
                  ].map(item => (
                    <li key={item} className="flex gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Backend */}
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-3xl p-7 border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all">
                <div className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-4 uppercase tracking-wider">FastAPI + LangGraph · Port 8000</div>
                <h4 className="text-lg font-black text-slate-900 mb-3">Backend AI Engine</h4>
                <ul className="space-y-2">
                  {[
                    "LangGraph StateGraph orchestrates every agent run end-to-end",
                    "Semantic Caching (Pinecone-backed <50ms exact-match replies)",
                    "Token Bucket Rate Limiting (Multi-tenant noisy-neighbor protection)",
                    "Microsoft Presidio PII Redaction (SSN/Email anonymisation)",
                    "PostgreSQL Data Warehouse with mandatory Row-Level Security (RLS)",
                    "Output Guardrails (Dual-LLM entailment checks to block hallucinations)",
                    "Asynchronous Background Ingestion (No ALB timeouts on large PDFs)",
                  ].map(item => (
                    <li key={item} className="flex gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chat UI */}
              <div className="bg-gradient-to-br from-violet-50 to-white rounded-3xl p-7 border-2 border-violet-100 hover:border-violet-300 hover:shadow-xl transition-all">
                <div className="text-[10px] font-black text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full inline-block mb-4 uppercase tracking-wider">Next.js 15 · Port 3001 · basePath /chat</div>
                <h4 className="text-lg font-black text-slate-900 mb-3">Chat UI Service</h4>
                <ul className="space-y-2">
                  {[
                    "LangGraph SDK React — full streaming state management",
                    "Next.js API proxy at /chat/api/langgraph/* (server-side)",
                    "Translates LangGraph SDK wire calls → VegaRAG REST API",
                    "Thread history sidebar grouped by assistantId",
                    "Per-agent branding: custom name + logo from backend config",
                    "Artifact renderer for structured outputs, tool call display",
                    "SSE event reconstruction with stable message IDs",
                  ].map(item => (
                    <li key={item} className="flex gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center my-5">
            <div className="flex flex-col items-center">
              <div className="w-px h-8 bg-gradient-to-b from-slate-200 to-emerald-400" />
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-emerald-400" />
            </div>
          </div>

          {/* ── Layer 3: LangGraph Agent Flow ── */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black">LG</div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Layer 3 — LangGraph StateGraph Agent Topology</h3>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="bg-slate-900 rounded-3xl p-8 text-white">
              <div className="grid grid-cols-1 md:grid-cols-9 gap-0 items-start">
                {[
                  { step: "01", title: "Entry Node", color: "blue", desc: "User query enters StateGraph. Session ID, bot_id, conversation history loaded from DynamoDB context." },
                  { step: "02", title: "Intent Router", color: "purple", desc: "Bedrock Nova Lite classifies as casual, rag, or sql using strict JSON schema structured output parsing." },
                  { step: "03", title: "Branch Executor", color: "orange", desc: "Conditional edge dispatches to RAG retriever node, SQL executor node, or direct casual LLM node." },
                  { step: "04", title: "Context Injector", color: "emerald", desc: "Retrieved Pinecone chunks or DuckDB SQL rows injected into prompt as <context>...</context> XML markers." },
                  { step: "05", title: "SSE Streamer", color: "pink", desc: "Bedrock Nova Pro streams tokens. FastAPI yields each chunk as SSE to the Chat UI proxy and then to the browser." },
                ].map(({ step, title, color, desc }, i) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center text-center p-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs mb-3 ${
                        color === "blue" ? "bg-blue-500/20 border border-blue-500/40 text-blue-400" :
                        color === "purple" ? "bg-purple-500/20 border border-purple-500/40 text-purple-400" :
                        color === "orange" ? "bg-orange-500/20 border border-orange-500/40 text-orange-400" :
                        color === "emerald" ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" :
                        "bg-pink-500/20 border border-pink-500/40 text-pink-400"
                      }`}>{step}</div>
                      <div className={`text-[10px] font-black uppercase tracking-wider mb-2 ${
                        color === "blue" ? "text-blue-400" : color === "purple" ? "text-purple-400" :
                        color === "orange" ? "text-orange-400" : color === "emerald" ? "text-emerald-400" : "text-pink-400"
                      }`}>{title}</div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{desc}</p>
                    </div>
                    {i < 4 && (
                      <div className="hidden md:flex justify-center items-center text-slate-600 text-xl font-black pt-4">→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center my-5">
            <div className="flex flex-col items-center">
              <div className="w-px h-8 bg-gradient-to-b from-slate-200 to-purple-400" />
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-purple-400" />
            </div>
          </div>

          {/* ── Layer 4: Data Stores ── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs font-black">DB</div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Layer 4 — Persistent Data Stores</h3>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: "DynamoDB (Single Table)", colorClass: "text-blue-600 bg-blue-50", badge: "Primary Store", bullet: "text-blue-500", items: ["PK: USER#{email} → agent list per user", "PK: AGENT#{id} / SK: CONFIG → prompt, brand, chat title/logo", "PK: AGENT#{id} / SK: SOURCE#* → data sources", "PK: ACTIVITY#{id} / SK: ENTRY#* → full chat logs", "PK: STATS#{id} / SK: DAY#* → daily query metrics"] },
                { title: "Pinecone Vector DB", colorClass: "text-emerald-600 bg-emerald-50", badge: "Semantic Engine", bullet: "text-emerald-500", items: ["Namespace-per-agent isolation (no cross-contamination)", "Amazon Titan v2 embeddings (1536-dim)", "Top-5 cosine similarity ANN retrieval", "Semantic Caching: Sub-50ms cache hits bypassing LLM", "Sub-50ms query latency at scale"] },
                { title: "PostgreSQL Data Warehouse", colorClass: "text-orange-600 bg-orange-50", badge: "SQL Analytics", bullet: "text-orange-500", items: ["Mandatory Row-Level Security (SET LOCAL app.current_tenant)", "Text-to-SQL via Bedrock Nova structured output", "Read-only session enforcement (blocks DROP/DELETE)", "Cross-tenant data leakage structurally impossible", "Enterprise-scale persistence and execution"] },
                { title: "OpenTelemetry + CloudWatch", colorClass: "text-purple-600 bg-purple-50", badge: "Observability", bullet: "text-purple-500", items: ["Structured JSON Logging (TraceID/SpanID injection)", "AWS X-Ray Distributed Waterfall Tracing", "CloudWatch Logs: /ecs/vegarag-* log streams", "CloudWatch Metrics: task CPU + memory graphs", "ALB access logs for traffic + error analysis"] },
              ].map(({ title, colorClass, badge, bullet, items }) => (
                <div key={title} className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-all duration-300">
                  <div className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block mb-3 uppercase tracking-wider ${colorClass}`}>{badge}</div>
                  <h4 className="font-black text-slate-900 text-sm mb-3">{title}</h4>
                  <ul className="space-y-1.5">
                    {items.map(item => (
                      <li key={item} className="flex gap-2 text-[11px] text-slate-500 leading-relaxed">
                        <span className={`${bullet} mt-0.5 flex-shrink-0`}>▸</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ── 12-Step Request Lifecycle ── */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 rounded-3xl p-8 border border-blue-100">
            <div className="text-center mb-8">
              <h3 className="text-xl font-black text-slate-900 mb-2">Complete Request Lifecycle — A to Z</h3>
              <p className="text-sm text-slate-500 font-medium">Every single hop from the browser to Bedrock and back, in exact order.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ["1", "User visits vegarag.com/chat?assistantId=bot_xxx", "Browser hits Route 53 → resolves to ALB → HTTPS listener on port 443"],
                ["2", "ALB matches /chat/* priority rule → forwards to TG-ChatUI on port 3001", "Chat UI Next.js container (basePath=/chat) receives the request and serves the React app"],
                ["3", "React app boots, LangGraph SDK reads assistantId from URL query param", "SDK fetches /chat/api/langgraph/info → Next.js proxy returns {version} confirming proxy is alive"],
                ["4", "SDK calls POST /chat/api/langgraph/threads/search to load thread history", "Next.js proxy hits backend GET /api/agents/{id}/activity → groups by session_id → returns thread list"],
                ["5", "User types a message and submits the chat form", "SDK fires POST /chat/api/langgraph/threads/{thread_id}/runs/stream with message payload"],
                ["6", "Next.js proxy receives request, extracts query text + bot_id", "Forwards to backend POST /api/chat as {bot_id, session_id, query} JSON body"],
                ["7", "FastAPI receives request, starts LangGraph StateGraph run", "Entry node loads conversation history from DynamoDB, initializes GraphState"],
                ["8", "Intent Router node calls Bedrock Nova Lite with structured schema", "LLM returns JSON: {intent: 'rag'|'sql'|'casual'} — conditional edge dispatches to correct branch"],
                ["9", "RAG branch: Titan v2 embeds query → Pinecone top-5 cosine ANN search", "SQL branch: Nova generates SQL → DuckDB executes in-memory → structured rows returned"],
                ["10", "Context injected into Nova Pro prompt via <context>...</context> XML markers", "FastAPI AsyncIterator chunks Bedrock token stream → yields SSE events: data: {text: '...'}"],
                ["11", "Next.js proxy re-wraps backend SSE as valid LangGraph values events", "Browser LangGraph SDK React hook receives events, updates message state, renders tokens progressively"],
                ["12", "Stream ends. SDK fires GET /chat/api/langgraph/threads/{id}/state", "Proxy fetches full session from DynamoDB, reconstructs LangGraph message format with stable IDs"],
              ].map(([num, left, right]) => (
                <div key={num} className="flex gap-3 bg-white/80 backdrop-blur rounded-xl p-4 border border-white">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{num}</div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">{left}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{right}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/features"
              className="inline-flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all">
              See the full technical breakdown <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ── Deployment Choice Section ── */}
        <section className="py-24 px-6 max-w-6xl mx-auto border-t border-slate-100">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Deploy exactly how you want.</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">Choose between zero-config managed hosting up to 250k free tokens, or own your data completely by deploying the open-source platform into your AWS account.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-10 md:p-14 rounded-[2.5rem] border border-slate-200 hover:border-blue-300 transition-colors group">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-4">The Free SaaS Trial</h3>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">Test your agents instantly without touching AWS. We provide Amazon Bedrock compute and Pinecone vector hosting free for up to <strong>250,000 tokens per month</strong> and 100MB of storage.</p>
              <div className="flex gap-4">
                <button onClick={() => auth.signinRedirect()} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition w-full text-center">Start Free Trial</button>
              </div>
            </div>

            <div className="bg-slate-900 p-10 md:p-14 rounded-[2.5rem] text-white border border-slate-800 hover:border-slate-700 transition-colors group relative overflow-hidden">
              <div className="w-16 h-16 bg-slate-800 text-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Terminal className="w-8 h-8" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-4">Self-Host Open Source</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">Use our exhaustive GitHub deployment instructions to provision 100% of the infrastructure inside your own AWS VPC using strict ECS Fargate zero-key Task IAM boundaries.</p>
              <div className="flex gap-4 relative z-10">
                <Link href="/deploy" className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition w-full text-center border border-white/20">Read the Deploy Guide</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA banner ── */}
        <section className="py-20 px-6 max-w-4xl mx-auto">
          <div className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 opacity-20 blur-[100px] rounded-full" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">Ready to deploy?</h2>
              <p className="text-slate-400 text-lg font-medium mb-10 max-w-xl mx-auto">
                Free forever. Self-host on AWS Fargate in under an hour.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => auth.signinRedirect()}
                  className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition shadow-xl">
                  Start Building Free
                </button>
                <Link href="/pricing"
                  className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition border border-white/10">
                  See Pricing →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-100 py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2 font-bold text-slate-600">
              <Bot className="w-5 h-5 text-blue-600" /> VegaRAG
            </div>
            <p>© {new Date().getFullYear()} VegaRAG. Open-source AI agent platform.</p>
            <div className="flex gap-6 font-semibold">
              {[
                { label: "Features", href: "/features" },
                { label: "Pricing", href: "/pricing" },
                { label: "Blog", href: "/blog" },
                { label: "GitHub", href: "https://github.com/challayashwanth1998-png/vega-rag" },
              ].map(l => (
                <Link key={l.label} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined}
                  className="hover:text-blue-600 transition">{l.label}</Link>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
