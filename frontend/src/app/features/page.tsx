"use client";
import Link from "next/link";
import {
  Bot, ArrowRight, Database, Zap, Layers, Globe, FileText, FileSpreadsheet,
  CheckCircle2, Github, Code2, Shield, Server, ArrowDownToLine, MessageSquare, Cloud
} from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { ArchitectureFlow } from "@/components/ArchitectureFlow";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900 selection:bg-blue-100">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6">
          Architected for <span className="text-blue-600">Production.</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto">
          VegaRAG is not a toy prototype. It’s a multi-agent system built entirely on AWS Fargate, S3, DynamoDB, Pinecone, and DuckDB.
        </p>
      </section>

      {/* ── Basic Architecture Summary ── */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-center mb-16 tracking-tighter text-slate-900 uppercase italic">
          <span className="underline decoration-blue-500 decoration-4 underline-offset-8">The Production Stack</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-stretch">
            
            {/* 01: User Entry */}
            <div className="p-10 bg-white border-2 border-slate-100 rounded-[3rem] shadow-xl flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm"><MessageSquare className="w-8 h-8" /></div>
               <h4 className="font-black text-slate-900 text-2xl uppercase tracking-tighter italic mb-4">01. Safe Interface</h4>
               <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">Authenticated Next.js 15 sandbox with Amazon Cognito for enterprise-grade security.</p>
               <div className="w-full h-1 bg-blue-100 rounded-full" />
            </div>

            {/* 02: Core Orchestration */}
            <div className="p-10 bg-blue-600 rounded-[3rem] shadow-2xl flex flex-col items-center text-center text-white scale-105">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-xl"><Zap className="w-8 h-8 animate-pulse" /></div>
               <h4 className="font-black text-white text-2xl uppercase tracking-tighter italic mb-4">02. Fargate Brain</h4>
               <p className="text-sm text-blue-100 font-medium leading-relaxed mb-6">AWS ECS Fargate host running the multi-agent LangGraph orchestrator.</p>
               <div className="px-4 py-2 bg-blue-700/50 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Active Reasoning Hub</div>
            </div>

            {/* 03: Knowledge Tier */}
            <div className="p-10 bg-white border-2 border-slate-100 rounded-[3rem] shadow-xl flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm"><Database className="w-8 h-8" /></div>
               <h4 className="font-black text-slate-900 text-2xl uppercase tracking-tighter italic mb-4">03. Context Layer</h4>
               <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">Bedrock Nova inference with Pinecone Serverless for sub-100ms vector memory.</p>
               <div className="w-full h-1 bg-emerald-100 rounded-full" />
            </div>
            
        </div>
      </section>
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
              <Database className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tight">Advanced RAG Pipelines</h3>
            <p className="text-slate-500 text-lg leading-relaxed mb-6">
              When users upload PDFs or enter URLs, VegaRAG automatically chunks, generates embeddings using Amazon Titan v2, and ships them to a Serverless Pinecone Index.
            </p>
            <ul className="space-y-4 font-semibold text-slate-700">
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Sub-100ms vector retrieval</li>
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Multi-tenant namespace isolation</li>
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> LangChain PDF and Web scraping integrated</li>
            </ul>
          </div>
          
          <div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-6">
              <Zap className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tight">Text-to-SQL on CSV & Excel</h3>
            <p className="text-slate-500 text-lg leading-relaxed mb-6">
              RAG is terrible for math. When users ask aggregate questions ("What was the total revenue in Q3?"), VegaRAG translates it into DuckDB SQL and queries the raw sheet in-memory.
            </p>
            <ul className="space-y-4 font-semibold text-slate-700">
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> Native DuckDB HTTPFS integration</li>
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> S3-backed CSV storage</li>
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> DynamoDB Schema inference system</li>
            </ul>
          </div>

          <div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <Server className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tight">Streaming Next.js + FastAPI</h3>
            <p className="text-slate-500 text-lg leading-relaxed mb-6">
              The graph only fetches contexts. Response generation uses Server-Sent Events (SSE) direct from Amazon Bedrock Nova, resulting in instant time-to-first-token.
            </p>
            <ul className="space-y-4 font-semibold text-slate-700">
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Decoupled orchestration</li>
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Full Markdown rendering in UI</li>
            </ul>
          </div>

          <div>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-slate-700" />
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tight">Containerized for Fargate</h3>
            <p className="text-slate-500 text-lg leading-relaxed mb-6">
              No black-box PaaS. Deploys natively to AWS ECS Fargate via an Application Load Balancer. Secure, zero-key IAM task roles enforce strict permissions.
            </p>
            <ul className="space-y-4 font-semibold text-slate-700">
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0" /> Frontend and Backend Dockerfiles provided</li>
              <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0" /> Amazon Cognito Auth wrapper setup</li>
            </ul>
          </div>

        </div>
      </section>

      {/* ── Infra Security Breakdown ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto border-t border-slate-100">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-widest mb-4">
            Security Deep Dive
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-6">
            Zero-Trust Architectural Security.
          </h2>
          <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto">
            VegaRAG is designed to process highly sensitive corporate data. That requires a private infrastructure without third-party vendor access.
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-10 blur-[100px] rounded-full" />
             <div className="relative z-10">
               <h3 className="text-2xl font-black mb-4 group-hover:text-blue-400 transition">1. IAM Task-Role Authentication</h3>
               <p className="text-slate-400 text-lg leading-relaxed mb-6">
                 We deploy on AWS ECS Fargate using <strong>Task Roles</strong>. There are strictly NO naked AWS Secret Keys injected into environment variables. Fargate containers natively inherit short-lived credentials to communicate with S3, DynamoDB, and Bedrock.
               </p>
               <div className="bg-black/50 p-4 rounded-xl border border-white/10 font-mono text-sm text-emerald-400">
                 arn:aws:iam::aws:policy/AmazonBedrockFullAccess
               </div>
             </div>
          </div>

          <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm">
             <h3 className="text-2xl font-black text-slate-900 mb-4">2. VPC Back-plane Isolation</h3>
             <p className="text-slate-500 text-lg leading-relaxed">
               Because VegaRAG uses Amazon Bedrock natively, inference calls to Amazon Nova or Claude architectures do NOT traverse the public internet. All API requests are routed securely via the Amazon backbone network within your VPC, bypassing typical REST endpoint exposure that plagues other LLM wrappers.
             </p>
          </div>

          <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm">
             <h3 className="text-2xl font-black text-slate-900 mb-4">3. Absolute Vector Separation</h3>
             <p className="text-slate-500 text-lg leading-relaxed">
               Pinecone Serverless namespaces act as our tenant boundary. A query invoked by `user_bot_1` strictly injects `namespace="user_bot_1"` directly into the core Pinecone gRPC call on the backend. It is computationally impossible for a prompt injection attack from one tenant to retrieve documents belonging to a different namespace.
             </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-12 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} VegaRAG Open Source</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-blue-600 transition">Back to Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
