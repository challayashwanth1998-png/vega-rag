"use client";

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Node,
  Edge,
  Connection,
  Handle,
  Position,
  Panel,
  ReactFlowProvider,
  MarkerType,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Bot, 
  User, 
  Zap, 
  MessageSquare, 
  Globe, 
  LogOut, 
  Layers, 
  Play, 
  Save, 
  Plus, 
  X, 
  Settings2,
  PhoneForwarded,
  Code2,
  Trash2,
  ChevronRight,
  Database,
  Link as LinkIcon,
  Search,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '@/lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Custom Nodes ---

const BaseNode = ({ children, title, icon: Icon, selected, typeColor }: any) => (
  <div className={cn(
    "min-w-[280px] bg-white rounded-[2rem] border-2 shadow-2xl transition-all duration-300 group overflow-hidden",
    selected ? "border-slate-900 scale-[1.02] shadow-slate-200" : "border-slate-100"
  )}>
    <div className={cn("px-6 py-4 flex items-center justify-between border-b border-slate-50", typeColor)}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-xl">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-white text-[10px] uppercase tracking-[0.2em] leading-none">{title}</span>
      </div>
      <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const StartNode = ({ data, selected }: any) => (
  <>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-red-500 border-2 border-white" />
    <BaseNode title="Flow Entry" icon={Play} selected={selected} typeColor="bg-red-500">
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Greeting</p>
        <textarea 
          placeholder="How should your bot introduce itself?"
          className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-900 border-2 border-transparent focus:border-red-100 outline-none h-24 resize-none transition"
          defaultValue={data.message || "Hello! How can I help you today?"}
          onChange={(e) => data.message = e.target.value}
        />
      </div>
    </BaseNode>
  </>
);

const ChatNode = ({ data, selected }: any) => (
  <>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-900 border-2 border-white" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-600 border-2 border-white" />
    <BaseNode title="AI Brain" icon={Bot} selected={selected} typeColor="bg-blue-600">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="p-2 bg-blue-600 rounded-lg"><Database className="w-4 h-4 text-white" /></div>
            <div>
                <p className="text-[9px] font-black text-blue-600 uppercase leading-none mb-1">Context Mode</p>
                <p className="text-xs font-black text-slate-900">Pinecone RAG Active</p>
            </div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model</p>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold text-slate-900">
            Bedrock Nova Micro
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Instructions</p>
        <textarea 
          placeholder="Strict instructions for the LLM..."
          className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-900 border-2 border-transparent focus:border-blue-100 outline-none h-20 resize-none transition"
          onChange={(e) => data.prompt = e.target.value}
          defaultValue={data.prompt}
        />
      </div>
    </BaseNode>
  </>
);

const ApiNode = ({ data, selected }: any) => (
  <>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-900 border-2 border-white" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-600 border-2 border-white" />
    <BaseNode title="REST Action" icon={Code2} selected={selected} typeColor="bg-emerald-600">
      <div className="space-y-4">
        <div className="flex gap-2">
            <select 
                className="bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg px-2 border-none outline-none"
                defaultValue={data.method || "POST"}
                onChange={(e) => data.method = e.target.value}
            >
                <option>POST</option>
                <option>GET</option>
                <option>PUT</option>
            </select>
            <span className="text-[10px] font-bold text-slate-400 truncate">Endpoint URL</span>
        </div>
        <div className="space-y-3">
             <input 
                type="text" 
                placeholder="https://api.acme.com/v1" 
                className="w-full bg-slate-50 p-3 rounded-xl text-[10px] font-bold border-2 border-transparent focus:border-emerald-100 outline-none" 
                defaultValue={data.url}
                onChange={(e) => data.url = e.target.value}
             />
             <div className="p-4 bg-slate-950 rounded-2xl font-mono text-[9px] text-emerald-400 overflow-hidden text-ellipsis">
                {`{ "user": "{{userId}}", "action": "update" }`}
             </div>
        </div>
      </div>
    </BaseNode>
  </>
);

const HumanNode = ({ data, selected }: any) => (
  <>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-900 border-2 border-white" />
    <BaseNode title="Human Agent" icon={PhoneForwarded} selected={selected} typeColor="bg-purple-600">
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escalation Logic</p>
        <p className="text-xs font-bold text-slate-700 leading-relaxed">
            Routes this conversation to your live chat team when triggered.
        </p>
        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl w-fit">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Team Online
        </div>
      </div>
    </BaseNode>
  </>
);

const nodeTypes = {
  start: StartNode,
  chat: ChatNode,
  api: ApiNode,
  human: HumanNode,
};

// --- Main Inner Workflow Component ---

function WorkflowCanvas() {
    const { botId } = useParams();
    const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();
    
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isPreviewOpen, setPreviewOpen] = useState(false);
    const [previewChat, setPreviewChat] = useState<{role: 'user' | 'bot', text: string}[]>([]);
    const [previewInput, setPreviewInput] = useState("");

    // Load Workflow
    useEffect(() => {
        fetch(`${api.baseUrl}/api/agents/${botId}/workflow`)
            .then(res => res.json())
            .then(data => {
                setNodes(data.nodes || []);
                setEdges(data.edges || []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load workflow", err);
                setIsLoading(false);
            });
    }, [botId, setNodes, setEdges]);

    const onSave = async () => {
        setIsSaving(true);
        try {
            await fetch(`${api.baseUrl}/api/agents/${botId}/workflow`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nodes: getNodes(),
                    edges: getEdges()
                })
            });
            // Show sublte success
        } catch (err) {
            console.error("Save error", err);
        }
        setIsSaving(false);
    };

    const onConnect = useCallback((params: Connection) => {
        setEdges((eds) => addEdge({
            ...params,
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
        }, eds));
    }, [setEdges]);

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: `node_${Date.now()}`,
                type,
                position,
                data: { label: `${type} node` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const handlePreviewSend = () => {
        if (!previewInput.trim()) return;
        setPreviewChat([...previewChat, {role: 'user', text: previewInput}]);
        setPreviewInput("");
        // Mock Response logic
        setTimeout(() => {
            setPreviewChat(prev => [...prev, {role: 'bot', text: "Workflow Simulation: This response would be generated based on your canvas logic."}]);
        }, 800);
    };

    if (isLoading) return (
        <div className="flex h-full w-full items-center justify-center bg-white">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="flex h-full bg-slate-50 font-sans overflow-hidden">
            {/* Canvas Sidebar */}
            <aside className={cn(
                "bg-white border-r-2 border-slate-100 flex flex-col transition-all duration-500 z-50",
                isSidebarOpen ? "w-80" : "w-0 -ml-80"
            )}>
                <div className="p-8 border-b border-slate-50">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-2.5 bg-slate-900 rounded-2xl"><Layers className="w-5 h-5 text-white" /></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none italic uppercase underline decoration-blue-500 decoration-2 underline-offset-4">Node Library</h2>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">Functional Blocks</p>
                        {[
                            { type: 'start', icon: Play, color: 'bg-red-500', name: 'Flow Entry', desc: 'Starting point' },
                            { type: 'chat', icon: Bot, color: 'bg-blue-600', name: 'LLM Engine', desc: 'RAG Intelligence' },
                            { type: 'api', icon: Code2, color: 'bg-emerald-600', name: 'REST Action', desc: 'External API' },
                            { type: 'human', icon: PhoneForwarded, color: 'bg-purple-600', name: 'Handoff', desc: 'Human Transfer' },
                        ].map((item) => (
                            <div 
                                key={item.type}
                                draggable 
                                onDragStart={(e) => onDragStart(e, item.type)}
                                className="flex items-center gap-4 p-4 bg-white border-2 border-slate-50 rounded-2xl cursor-grab hover:border-slate-900 hover:shadow-xl transition group"
                            >
                                <div className={cn("p-2.5 rounded-xl group-hover:scale-110 transition shrink-0", item.color)}><item.icon className="w-4 h-4 text-white" /></div>
                                <div>
                                    <p className="font-bold text-slate-900 text-xs">{item.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-auto p-8 border-t border-slate-50 flex flex-col gap-4">
                    <button 
                        onClick={onSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2l hover:bg-slate-800 transition disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                        Save Workflow
                    </button>
                    <Link href="/agents" className="w-full flex items-center justify-center gap-3 p-4 bg-slate-100 text-slate-700 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">
                        <LogOut className="w-4 h-4" /> Exit Studio
                    </Link>
                </div>
            </aside>

            {/* Main Canvas Area */}
            <main className="flex-1 relative bg-white">
                <Panel position="top-left" className="m-6 flex items-center gap-3 pointer-events-none">
                    <button 
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-xl hover:bg-slate-50 transition pointer-events-auto"
                    >
                        {isSidebarOpen ? <X className="w-4 h-4 text-slate-900" /> : <Layers className="w-4 h-4 text-slate-900" />}
                    </button>
                    <div className="p-3 px-6 bg-white/50 backdrop-blur-3xl border-2 border-white/50 rounded-2xl shadow-2xl flex items-center gap-3">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <h1 className="text-sm font-black text-slate-900 italic tracking-tighter uppercase tracking-widest">Canvas V1</h1>
                    </div>
                </Panel>

                <Panel position="top-right" className="m-6 flex items-center gap-3">
                    <button 
                        onClick={() => setPreviewOpen(!isPreviewOpen)}
                        className={cn(
                            "flex items-center gap-2 p-3 px-5 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest transition",
                            isPreviewOpen ? "bg-orange-500 text-white" : "bg-white text-slate-900 border-2 border-slate-100"
                        )}
                    >
                        {isPreviewOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {isPreviewOpen ? "Close Preview" : "Live Preview"}
                    </button>
                </Panel>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    fitView
                    className="bg-white"
                >
                    <Background color="#f1f5f9" gap={30} className="opacity-40" />
                    <Controls className="bg-white border-2 border-slate-100 rounded-2xl shadow-xl overflow-hidden" />
                </ReactFlow>

                {/* Preview Overlay */}
                <AnimatePresence>
                    {isPreviewOpen && (
                        <motion.div 
                            initial={{ x: 400, opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }} 
                            exit={{ x: 400, opacity: 0 }}
                            className="absolute top-0 right-0 h-full w-[400px] bg-white border-l-2 border-slate-100 shadow-2xl z-40 flex flex-col"
                        >
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs italic">Live Engine Mock</h3>
                                </div>
                                <X className="w-5 h-5 text-slate-300 cursor-pointer" onClick={() => setPreviewOpen(false)} />
                            </div>
                            
                            <div className="flex-1 p-8 overflow-y-auto space-y-4">
                                {previewChat.map((msg, i) => (
                                    <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "max-w-[80%] p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm",
                                            msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none"
                                        )}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {previewChat.length === 0 && (
                                    <div className="text-center py-20">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Start a conversation to test the logic</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-slate-50">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Type a test message..." 
                                        className="flex-1 bg-slate-50 border-2 border-transparent focus:border-blue-100 p-4 rounded-2xl outline-none text-xs font-bold"
                                        value={previewInput}
                                        onChange={(e) => setPreviewInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePreviewSend()}
                                    />
                                    <button 
                                        onClick={handlePreviewSend}
                                        className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-blue-600 transition"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

export default function AgentWorkflowPage() {
    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-md">
                <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2rem] shadow-2xl max-w-lg text-center mx-4">
                    <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Layers className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Workflow Studio<br/><span className="text-blue-500">Coming Soon</span></h2>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed mb-4">
                        The visual drag-and-drop Workflow engine is currently under construction. Stay tuned to build advanced node-based chat logic!
                    </p>
                </div>
            </div>
            
            {/* Blurred Studio */}
            <div className="w-full h-full pointer-events-none opacity-40 blur-sm select-none">
                <ReactFlowProvider>
                    <WorkflowCanvas />
                </ReactFlowProvider>
            </div>
        </div>
    );
}
