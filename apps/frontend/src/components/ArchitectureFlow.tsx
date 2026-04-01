"use client";

import React, { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Shield, Globe, Bot, Zap, Database, Layers, Cloud, 
  MessageSquare, FileText, Server, Clock, Search
} from 'lucide-react';

const initialNodes = [
  // User Layer
  {
    id: 'user',
    position: { x: 50, y: 150 },
    data: { 
      label: (
        <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col items-center">
          <MessageSquare className="w-6 h-6 text-slate-400 mb-2" />
          <div className="font-bold text-xs">User Query</div>
          <div className="text-[10px] text-slate-500">HTTPS / WebSocket</div>
        </div>
      ) 
    },
    style: { width: 140 },
  },
  
  // Auth Layer
  {
    id: 'cognito',
    position: { x: 250, y: 50 },
    data: { 
      label: (
        <div className="p-4 bg-slate-50 rounded-2xl border-2 border-amber-200 shadow-sm flex flex-col items-center">
          <Shield className="w-6 h-6 text-amber-500 mb-2" />
          <div className="font-bold text-xs uppercase text-amber-900 tracking-tighter">Amazon Cognito</div>
          <div className="text-[10px] text-amber-700">JWT Authentication</div>
        </div>
      ) 
    },
    style: { width: 160 },
  },
  {
    id: 'alb',
    position: { x: 250, y: 150 },
    data: { 
      label: (
        <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col items-center">
          <Layers className="w-6 h-6 text-slate-400 mb-2" />
          <div className="font-bold text-xs text-slate-600">Application Load Balancer</div>
          <div className="text-[10px] text-slate-500 tracking-tighter font-black">AWS ALB</div>
        </div>
      ) 
    },
    style: { width: 160 },
  },

  // Main Orchestrator
  {
    id: 'fargate',
    position: { x: 500, y: 150 },
    data: { 
      label: (
        <div className="p-6 bg-blue-600 rounded-[2rem] border-4 border-blue-400/30 shadow-xl flex flex-col items-center text-white scale-110">
          <Zap className="w-8 h-8 text-white mb-2 animate-pulse" />
          <div className="font-black text-sm italic italic tracking-tighter uppercase underline decoration-white decoration-2 underline-offset-4 mb-1">AWS Fargate Orchestrator</div>
          <div className="text-[10px] font-black tracking-widest uppercase opacity-70">LangGraph Agent Engine</div>
        </div>
      ) 
    },
    style: { width: 220 },
  },

  // AI Inference (Bedrock Box)
  {
    id: 'bedrock_box',
    position: { x: 800, y: 20 },
    data: { label: <div /> },
    style: { width: 300, height: 260, backgroundColor: 'rgba(56, 189, 248, 0.05)', border: '2px dashed #0284c7', borderRadius: '1.5rem' },
  },
  {
    id: 'bedrock_title',
    position: { x: 820, y: 35 },
    parentNode: 'bedrock_box',
    data: { label: <div className="text-[10px] font-bold text-blue-600 flex items-center gap-2"><Globe className="w-3 h-3" /> Amazon Bedrock</div> },
    style: { backgroundColor: 'transparent', border: 'none' },
    extent: 'parent' as const,
  },
  {
    id: 'nova',
    position: { x: 20, y: 70 },
    parentNode: 'bedrock_box',
    data: { 
      label: (
        <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm text-center">
          <Bot className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-xs font-black">LLM: Nova Micro/Pro</div>
          <div className="text-[10px] text-slate-400">Response Streaming (SSE)</div>
        </div>
      ) 
    },
    style: { width: 120 },
    extent: 'parent' as const,
  },
  {
    id: 'titan',
    position: { x: 160, y: 70 },
    parentNode: 'bedrock_box',
    data: { 
      label: (
        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm text-center">
          <Layers className="w-5 h-5 text-slate-400 mx-auto mb-1" />
          <div className="text-xs font-black">Titan Text v2</div>
          <div className="text-[10px] text-slate-400">Vector Embeddings</div>
        </div>
      ) 
    },
    style: { width: 120 },
    extent: 'parent' as const,
  },
  {
    id: 'duckdb',
    position: { x: 90, y: 170 },
    parentNode: 'bedrock_box',
    data: { 
      label: (
        <div className="p-4 bg-white rounded-xl border border-purple-100 shadow-sm text-center">
          <Database className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <div className="text-xs font-black">DuckDB SQL</div>
          <div className="text-[10px] text-slate-400 font-bold">CSV/Excel Analytics</div>
        </div>
      ) 
    },
    style: { width: 120 },
    extent: 'parent' as const,
  },

  // State Layer (Bottom)
  {
    id: 'pinecone',
    position: { x: 450, y: 450 },
    data: { 
      label: (
        <div className="p-5 bg-white rounded-[2rem] border-2 border-emerald-500 shadow-lg flex flex-col items-center">
          <Database className="w-8 h-8 text-emerald-500 mb-2" />
          <div className="font-extrabold text-xs uppercase tracking-tighter">Pinecone Serverless</div>
          <div className="text-[10px] font-bold text-emerald-600">Vector Workspace Sync</div>
        </div>
      ) 
    },
    style: { width: 180 },
  },
  {
    id: 'dynamodb',
    position: { x: 700, y: 450 },
    data: { 
      label: (
        <div className="p-5 bg-white rounded-[2rem] border-2 border-orange-500 shadow-lg flex flex-col items-center">
          <Layers className="w-8 h-8 text-orange-500 mb-2" />
          <div className="font-extrabold text-xs uppercase tracking-tighter">Amazon DynamoDB</div>
          <div className="text-[10px] text-orange-600 font-bold">Agent Configuration & Logs</div>
        </div>
      ) 
    },
    style: { width: 200 },
  },
  {
    id: 's3',
    position: { x: 950, y: 450 },
    data: { 
      label: (
        <div className="p-5 bg-white rounded-[2rem] border-2 border-amber-600 shadow-lg flex flex-col items-center">
          <Cloud className="w-8 h-8 text-amber-600 mb-2" />
          <div className="font-extrabold text-xs uppercase tracking-tighter">Amazon S3</div>
          <div className="text-[10px] text-amber-700 font-bold">Raw Document / CSV Storage</div>
        </div>
      ) 
    },
    style: { width: 180 },
  },
];

const initialEdges = [
  // MAIN PATH (BOLD & HIGHLIGHTED)
  { 
    id: 'e-user-alb', source: 'user', target: 'alb', 
    style: { stroke: '#1e293b', strokeWidth: 4 }, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#1e293b', width: 14, height: 14 } 
  },
  { 
    id: 'e-alb-fargate', source: 'alb', target: 'fargate', 
    animated: true, 
    style: { stroke: '#2563eb', strokeWidth: 6 }, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb', width: 20, height: 20 } 
  },
  { 
    id: 'e-fargate-nova', source: 'fargate', target: 'nova', 
    animated: true, 
    style: { stroke: '#0ea5e9', strokeWidth: 5 }, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9', width: 16, height: 16 } 
  },
  { 
    id: 'e-fargate-return', source: 'fargate', target: 'user', 
    animated: true, 
    style: { stroke: '#16a34a', strokeWidth: 6, strokeDasharray: '12,6' }, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#16a34a', width: 22, height: 22 },
    label: 'RESULT STREAM (SSE)', 
    labelStyle: { fill: '#16a34a', fontWeight: 900, fontSize: '12px' } 
  },

  // DATA/AUTH PATHS (DARK BUT THINNER)
  { 
    id: 'e-alb-cognito', source: 'alb', target: 'cognito', 
    style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '6,6' }, 
    markerEnd: { type: MarkerType.Arrow, color: '#f59e0b' } 
  },
  { 
    id: 'e-fargate-titan', source: 'fargate', target: 'titan', 
    style: { stroke: '#64748b', strokeWidth: 2.5 }, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' } 
  },
  { 
    id: 'e-fargate-duckdb', source: 'fargate', target: 'duckdb', 
    style: { stroke: '#9333ea', strokeWidth: 2.5 }, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#9333ea' } 
  },
  { 
    id: 'e-fargate-pinecone', source: 'fargate', target: 'pinecone', 
    style: { stroke: '#10b981', strokeWidth: 3 }, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } 
  },
  { 
    id: 'e-fargate-dynamodb', source: 'fargate', target: 'dynamodb', 
    style: { stroke: '#f97316', strokeWidth: 3 }, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' } 
  },
  { 
    id: 'e-fargate-s3', source: 'fargate', target: 's3', 
    style: { stroke: '#d97706', strokeWidth: 3 }, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#d97706' } 
  },
];

export function ArchitectureFlow() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), []);

  return (
    <div style={{ width: '100%', height: '600px' }} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background color="#f1f5f9" gap={20} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} maskColor="rgba(241, 245, 249, 0.7)" />
      </ReactFlow>
      
      {/* Legend Override Overlay */}
      <div className="absolute top-6 right-6 z-20 space-y-2 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
              Interactive Architectural Map
          </div>
      </div>
    </div>
  );
}
