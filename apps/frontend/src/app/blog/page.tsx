import Link from "next/link";
import type { Metadata } from "next";
import { Bot, ArrowRight, Clock, Tag } from "lucide-react";

export const metadata: Metadata = {
    title: "Blog | VegaRAG — AI Agent Engineering, RAG Systems & AWS Bedrock",
    description: "In-depth tutorials and case studies on building production RAG pipelines, LangGraph multi-agent systems, and multi-tenant AI SaaS on AWS Fargate with Amazon Bedrock Nova.",
    keywords: "RAG pipeline tutorial, LangGraph agents, Amazon Bedrock Nova, Pinecone vector database, multi-tenant AI SaaS, Text-to-SQL DuckDB, AWS Fargate AI deployment",
    alternates: { canonical: "https://vegarag.com/blog" },
    openGraph: {
        title: "VegaRAG Blog — Production AI Engineering",
        description: "Real engineering content on RAG, LangGraph, and AI agents built on AWS.",
        type: "website",
        url: "https://vegarag.com/blog",
    },
};

const posts = [
    {
        slug: "building-production-rag-pipeline-aws-bedrock-pinecone",
        title: "Building a Production RAG Pipeline with AWS Bedrock and Pinecone",
        excerpt: "A complete guide to chunking, embedding with Amazon Titan v2, and serving sub-100ms queries from a Pinecone serverless index — including multi-tenant namespace isolation.",
        date: "2025-03-20",
        readTime: "12 min read",
        category: "Engineering",
        tags: ["RAG", "Bedrock", "Pinecone"],
    },
    {
        slug: "langgraph-multi-agent-routing-casual-rag-sql",
        title: "LangGraph Multi-Agent Routing: Casual Chat, RAG, and SQL in One Graph",
        excerpt: "How we built a single LangGraph that classifies user intent and routes to the right pipeline — direct LLM for casual chat, Pinecone for document queries, and DuckDB for CSV analytics.",
        date: "2025-03-22",
        readTime: "15 min read",
        category: "AI Architecture",
        tags: ["LangGraph", "Multi-Agent", "Text-to-SQL"],
    },
    {
        slug: "text-to-sql-duckdb-uploaded-csv-excel-files",
        title: "Text-to-SQL on User-Uploaded CSV and Excel Files with DuckDB",
        excerpt: "Users upload spreadsheets — the agent automatically generates SQL, executes it in-process with DuckDB, and returns results in natural language. Here's the exact implementation.",
        date: "2025-03-24",
        readTime: "10 min read",
        category: "Engineering",
        tags: ["DuckDB", "Text-to-SQL", "Data Analysis"],
    },
    {
        slug: "deploying-multi-tenant-ai-saas-aws-fargate-ecr",
        title: "Deploying a Multi-Tenant AI SaaS on AWS Fargate with ECR and ALB",
        excerpt: "The exact Docker → ECR → ECS Fargate deployment flow for VegaRAG: two services (frontend on port 3000, backend on 8000), one ALB, path-based routing, and Cognito auth.",
        date: "2025-03-26",
        readTime: "18 min read",
        category: "DevOps",
        tags: ["AWS", "Fargate", "Docker", "ECR"],
    },
    {
        slug: "amazon-bedrock-nova-micro-vs-claude-haiku-rag-cost",
        title: "Amazon Nova Micro vs Claude Haiku for RAG: Cost and Latency Benchmarks",
        excerpt: "We ran 10,000 queries through both models on identical RAG tasks. Nova Micro wins on price/latency for short-context answers. Full benchmark data included.",
        date: "2025-03-27",
        readTime: "8 min read",
        category: "Benchmarks",
        tags: ["Bedrock", "Nova", "Claude", "Cost"],
    },
    {
        slug: "pinecone-namespace-multi-tenant-isolation-best-practices",
        title: "Pinecone Namespace Strategy for Multi-Tenant RAG: Best Practices",
        excerpt: "One index, thousands of tenants — using Pinecone namespaces as the isolation boundary. Covers cost model, query pattern, and why we chose this over separate indexes.",
        date: "2025-03-28",
        readTime: "6 min read",
        category: "Architecture",
        tags: ["Pinecone", "Multi-Tenant", "Scalability"],
    },
];

const categoryColors: Record<string, string> = {
    "Engineering": "bg-blue-50 text-blue-700",
    "AI Architecture": "bg-purple-50 text-purple-700",
    "DevOps": "bg-emerald-50 text-emerald-700",
    "Benchmarks": "bg-amber-50 text-amber-700",
    "Architecture": "bg-slate-100 text-slate-700",
};

export default function BlogPage() {
    const [featured, ...rest] = posts;

    return (
        <div className="min-h-screen bg-transparent font-sans text-slate-900">
            {/* Nav */}
            <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
                        <Bot className="w-6 h-6 text-blue-600" /> VegaRAG
                    </Link>
                    <div className="flex items-center gap-6 text-sm font-semibold text-slate-600">
                        <Link href="/#features" className="hover:text-blue-600 transition">Features</Link>
                        <Link href="/blog" className="text-blue-600">Blog</Link>
                        <Link href="/agents" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">Dashboard</Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-16">
                {/* Header */}
                <header className="mb-16 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6">
                        Engineering Blog
                    </div>
                    <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-4 underline decoration-blue-500 decoration-4 underline-offset-8 uppercase italic font-black tracking-tighter">
                        Build Better AI Agents
                    </h1>
                    <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                        Deep technical content on RAG pipelines, LangGraph agents, Text-to-SQL, and production AI on AWS.
                    </p>
                </header>

                {/* Featured Post */}
                <Link href={`/blog/${featured.slug}`} className="group block mb-16">
                    <article className="bg-slate-900 text-white rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden hover:scale-[1.01] transition-transform duration-300">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 opacity-20 blur-[120px] rounded-full" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${categoryColors[featured.category]} bg-opacity-20`}>
                                    {featured.category}
                                </span>
                                <span className="text-slate-400 text-sm flex items-center gap-1.5"><Clock className="w-4 h-4" />{featured.readTime}</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 group-hover:text-blue-400 transition">
                                {featured.title}
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-2xl">{featured.excerpt}</p>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-500">{new Date(featured.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                                <span className="flex items-center gap-1.5 text-blue-400 font-bold text-sm group-hover:gap-3 transition-all">
                                    Read article <ArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                    </article>
                </Link>

                {/* Post Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rest.map((post) => (
                        <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                            <article className="h-full bg-white rounded-2xl border border-slate-200 p-8 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${categoryColors[post.category]}`}>
                                        {post.category}
                                    </span>
                                    <span className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                                </div>
                                <h2 className="text-lg font-black text-slate-900 mb-3 group-hover:text-blue-600 transition leading-snug flex-1">
                                    {post.title}
                                </h2>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">{post.excerpt}</p>
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {post.tags.map(t => (
                                        <span key={t} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                                            <Tag className="w-2.5 h-2.5" />{t}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400 font-medium">
                                    {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                            </article>
                        </Link>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-100 py-12 mt-20">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2 font-bold"><Bot className="w-5 h-5 text-blue-600" /> VegaRAG</div>
                    <p>© {new Date().getFullYear()} VegaRAG. Open-source AI agent platform.</p>
                    <div className="flex gap-6 font-semibold">
                        <Link href="/" className="hover:text-blue-600 transition">Home</Link>
                        <Link href="/blog" className="hover:text-blue-600 transition">Blog</Link>
                        <a href="https://github.com/challayashwanth1998-png/vega-rag" target="_blank" className="hover:text-blue-600 transition">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
