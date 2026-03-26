"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Bot, Clock, ArrowRight, Loader2, X } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "react-oidc-context";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AgentsGrid() {
  const auth = useAuth();
  
  // Robust Fallback: If Cognito doesn't inject the email into profile directly, fallback to sub or string!
  const userEmail = auth.user?.profile?.email || auth.user?.profile?.sub || "admin_user";
  const router = useRouter();
  
  // Connect to our new DynamoDB Backend Endpoint
  const { data: agents, mutate, isLoading } = useSWR(
    userEmail ? `http://localhost:8000/api/agents?user_email=${encodeURIComponent(userEmail)}` : null, 
    fetcher
  );
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAgent = async () => {
    if (!newAgentName.trim() || !userEmail || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("http://localhost:8000/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAgentName.trim(), user_email: userEmail })
      });
      const newAgent = await res.json();
      mutate();
      setNewAgentName("");
      setIsModalOpen(false);
      // Auto warp into the playground of the newly created agent!
      router.push(`/agents/${newAgent.bot_id}/playground`);
    } catch (error) {
      console.error(error);
    }
    setIsCreating(false);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto w-full min-h-screen bg-slate-50 relative">
      <header className="mb-10 flex justify-between items-center bg-transparent">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Your Agents</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage and deploy your RAG assistants.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-slate-900/20 flex items-center gap-2 hover:bg-slate-800 transition"
        >
          <Plus className="w-5 h-5" /> Create Agent
        </motion.button>
      </header>

      {/* Dynamic Grid */}
      {isLoading ? (
        <div className="flex w-full items-center justify-center p-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : agents?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50">
            <Bot className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No Agents Built Yet</h3>
            <p className="text-slate-500 mt-2 text-center max-w-md">Click "Create Agent" to setup your first intelligent bot connected to Pinecone.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {agents?.map((agent: any, i: number) => (
            <Link key={agent.bot_id} href={`/agents/${agent.bot_id}/playground`}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ease: "easeOut" }}
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer group flex flex-col h-[280px]"
              >
                {/* Agent Card Header Graphic */}
                <div className="h-28 bg-gradient-to-br from-blue-500 to-cyan-600 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition duration-300" />
                  <Bot className="w-10 h-10 text-white drop-shadow-md z-10 transition-transform group-hover:scale-110 duration-300" />
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition truncate pr-4">{agent.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                      Active
                    </span>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4" /> {new Date(agent.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-blue-600 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                      Open API <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Name your Agent</h2>
              <p className="text-slate-500 mb-6 font-medium">What role will this agent fill on your website?</p>
              
              <input 
                autoFocus
                type="text"
                placeholder="e.g. Acme Corp Customer Support..."
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateAgent()}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-5 py-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800 mb-6"
              />
              
              <button 
                disabled={isCreating || !newAgentName.trim()}
                onClick={handleCreateAgent}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Agent Engine"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
