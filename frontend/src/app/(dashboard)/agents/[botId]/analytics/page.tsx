"use client";

import { use } from "react";
import useSWR from "swr";
import { BarChart as BarGraphic, Activity, Bot } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AnalyticsPage({ params }: { params: any }) {
  const resolvedParams: any = use(params);
  const botId = resolvedParams.botId;

  const { data: analytics } = useSWR(`http://localhost:8000/api/agents/${botId}/analytics`, fetcher, { refreshInterval: 5000 });

  const totalQueries = analytics?.reduce((sum: number, item: any) => sum + item.queries, 0) || 0;

  // AWS Architecture Budgeting
  // Max Customer Spend: $0.10/mo.
  // Fargate/DynamoDB/Pinecone Share: ~$0.05/mo
  // LLM Allocate (Nova Micro/Titan): ~$0.05/mo -> 250,000 Tokens limit
  const EST_TOKENS_PER_QUERY = 1540; // 1,500 average context tokens + Titan embeddings
  const TOKEN_LIMIT_PER_MONTH = 250000; 
  const totalTokens = totalQueries * EST_TOKENS_PER_QUERY;
  const tokenPercentage = Math.min(100, Math.max(0, (totalTokens / TOKEN_LIMIT_PER_MONTH) * 100)).toFixed(1);

  return (
    <div className="p-10 max-w-5xl mx-auto w-full h-full overflow-y-auto">
       <div className="mb-10">
         <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
           <BarGraphic className="w-8 h-8 text-blue-600" /> Usage Analytics
         </h1>
         <p className="text-slate-500 mt-2 font-medium">Monitor Amazon Bedrock inference load alongside AWS Fargate limits.</p>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5" />
               </div>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-tight">Total Queries<br/><span className="text-slate-700 text-xl font-extrabold">{totalQueries}</span></p>
             </div>
             <p className="text-xs font-semibold text-slate-500 bg-slate-100 p-2 rounded-lg">~{EST_TOKENS_PER_QUERY.toLocaleString()} Tokens Extracted Per Query</p>
          </div>
          
          <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5"><Bot className="w-24 h-24" /></div>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Customer Quota ($0.10 AWS Limit)</p>
             <div className="flex items-end gap-3 mb-4">
               <h3 className="text-3xl font-extrabold text-slate-800">{totalTokens.toLocaleString()}</h3>
               <p className="text-lg font-bold text-slate-400 mb-1">/ {TOKEN_LIMIT_PER_MONTH.toLocaleString()} Tokens</p>
             </div>
             <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-blue-600 rounded-full transition-all duration-1000" style={{ width: `${tokenPercentage}%` }} />
             </div>
             <p className="text-xs font-bold text-blue-600 tracking-wide">{tokenPercentage}% of Allocation Used (Resets in 14 days)</p>
          </div>
       </div>

       <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-[450px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Inference Queries (Last 30 Days)</h3>
          
          <div className="flex-1 relative">
             {analytics && analytics.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={analytics} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6}/>
                       <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 500}} dy={15} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 500}} dx={-10} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                     itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                     cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }}
                   />
                   <Area type="monotone" dataKey="queries" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorBlue)" activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <Activity className="w-12 h-12 mb-3 text-slate-200" />
                  <p className="font-semibold text-slate-500">No usage data recorded yet.</p>
                  <p className="text-sm">Talk to your Widget to populate the graphics engine.</p>
               </div>
             )}
          </div>
       </div>
    </div>
  )
}
