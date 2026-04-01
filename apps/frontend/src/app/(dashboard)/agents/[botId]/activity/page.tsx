"use client";

import { use, useState, useMemo } from "react";
import useSWR from "swr";
import { MessageSquare, Bot, User, Clock, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ActivityPage({ params }: { params: any }) {
  const resolvedParams: any = use(params);
  const botId = resolvedParams.botId;

  const { data: logs, isLoading } = useSWR(`${api.baseUrl}/api/agents/${botId}/activity`, fetcher, { refreshInterval: 10000 });

  const [activeSession, setActiveSession] = useState<string | null>(null);

  const threads = useMemo(() => {
    if (!logs) return {};
    const grouped: any = {};
    logs.forEach((log: any) => {
      const sid = log.session_id || "legacy_sessions";
      if (!grouped[sid]) grouped[sid] = { logs: [], lastActive: log.timestamp };
      // unshift so the chat renders top-down chronologically inside the reader
      grouped[sid].logs.unshift(log); 
    });
    return grouped;
  }, [logs]);

  const threadIds = Object.keys(threads).sort((a, b) => new Date(threads[b].lastActive).getTime() - new Date(threads[a].lastActive).getTime());

  return (
    <div className="p-10 max-w-6xl mx-auto w-full h-full flex flex-col">
       <div className="mb-8 shrink-0">
         <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
           <MessageSquare className="w-8 h-8 text-blue-600" /> Chat Activity Logs
         </h1>
         <p className="text-slate-500 mt-2 font-medium">Review real-time conversations occurring on your agent widgets globally.</p>
       </div>
       
       <div className="flex flex-1 min-h-0 overflow-hidden bg-white border border-slate-200 rounded-[2rem] shadow-sm">
         
         {/* Left Sidebar: Session Threads */}
         <div className="w-[380px] border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/50">
           <div className="p-5 border-b border-slate-100 bg-white">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">Active Threads <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{threadIds.length}</span></h3>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading && <Loader2 className="w-6 h-6 text-slate-300 animate-spin mx-auto mt-10" />}
              {!isLoading && threadIds.length === 0 && (
                 <p className="text-sm font-medium text-slate-400 text-center mt-10">No chat history recorded.</p>
              )}
              {threadIds.map((sid) => {
                 const t = threads[sid];
                 const isActive = activeSession === sid;
                 const preview = t.logs[t.logs.length - 1].user_msg;
                 
                 return (
                   <button 
                     key={sid} 
                     onClick={() => setActiveSession(sid)}
                     className={`w-full text-left p-4 rounded-2xl transition-all border ${isActive ? "bg-white border-blue-500 shadow-[0_10px_20px_-10px_rgba(59,130,246,0.3)] ring-4 ring-blue-500/10" : "bg-white border-slate-100 shadow-sm hover:border-blue-200"}`}
                   >
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">ID: {sid.substring(0,8)}</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(t.lastActive).toLocaleDateString()}</span>
                     </div>
                     <p className="text-sm font-semibold text-slate-800 truncate mb-1">{preview}</p>
                     <p className="text-xs font-medium text-slate-500">{t.logs.length} interactions</p>
                   </button>
                 )
              })}
           </div>
         </div>

         {/* Right Sidebar: Chat Inspection */}
         <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
            {!activeSession ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                  <MessageSquare className="w-16 h-16 mb-4 text-slate-100" />
                  <p className="text-lg font-bold text-slate-500 mb-2">Select a Conversation</p>
                  <p className="text-sm font-medium max-w-sm">Choose a thread from the left panel to review the precise dialogue between the customer and the Agent.</p>
               </div>
            ) : (
               <>
                 <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white/80 backdrop-blur-sm z-10 shrink-0">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xl border border-blue-100">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Customer Session <span className="text-slate-400 font-mono text-sm ml-2">#{activeSession.substring(0,8)}</span></h3>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Recorded
                      </p>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">
                    <AnimatePresence>
                      {threads[activeSession]?.logs.map((log: any, idx: number) => (
                        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} key={idx} className="space-y-6">
                           {/* User Bubble */}
                           <div className="flex gap-4 flex-row-reverse">
                             <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                               <User className="w-4 h-4" />
                             </div>
                             <div className="bg-blue-600 text-white px-5 py-4 rounded-3xl rounded-tr-sm max-w-[80%] shadow-lg shadow-blue-600/20">
                               <p className="text-[15px] font-medium leading-relaxed">{log.user_msg}</p>
                             </div>
                           </div>

                           {/* AI Bubble */}
                           <div className="flex gap-4">
                             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                               <Bot className="w-4 h-4" />
                             </div>
                             <div className="bg-white border border-slate-200 text-slate-700 px-5 py-4 rounded-3xl rounded-tl-sm max-w-[85%] shadow-sm">
                               <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{log.ai_response}</p>
                             </div>
                           </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                 </div>
               </>
            )}
         </div>

       </div>
    </div>
  );
}
