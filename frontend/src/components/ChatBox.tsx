"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RefreshCcw, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";

import { api } from "@/lib/api";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ChatBox({ botId, hasSources = false }: { botId: string, hasSources?: boolean }) {
  const { data: config } = useSWR(`${api.baseUrl}/api/agents/${botId}/config`, fetcher);
  const { data: sources } = useSWR(`${api.baseUrl}/api/agents/${botId}/sources`, fetcher);
  
  const brandColor = config?.brand_color || "#2563eb";
  const agentName = config?.name || "AI Sandbox";

  const [messages, setMessages] = useState<{role: 'user'|'agent', content: string}[]>([
    { role: "agent", content: "Loading memory state..." }
  ]);
  const [input, setInput] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Natively assign an ephemeral thread identity to securely group Chat logs universally
  const [sessionId] = useState(() => typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(7));

  useEffect(() => {
    if (messages.length <= 1 && config) {
       setMessages([{ 
           role: "agent", 
           content: config.welcome_message || (hasSources ? "Hello! Memory sync complete. Ask me anything about the data you uploaded!" : "Hi! My brain is empty. Please add a Data Source to begin.")
       }]);
    }
  }, [hasSources, config]);

  useEffect(() => {
    const handleSync = () => {
      setMessages(prev => [...prev, { 
        role: "agent", 
        content: "🧠 Memory Base Updated! I have re-indexed your most recent links and texts. What would you like to ask me about it?" 
      }]);
    };
    window.addEventListener("memory-synced", handleSync);
    return () => window.removeEventListener("memory-synced", handleSync);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      setMessages(prev => [...prev, { role: "agent", content: "" }]); 
      
      const response = await fetch(`${api.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
        body: JSON.stringify({ 
           query: userMsg, 
           bot_id: botId, 
           session_id: sessionId,
           filter_source: selectedSource || null
        })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              aiResponse += data.text;
              setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1].content = aiResponse;
                return newArr;
              });
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      setMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1].content = "⚠️ Connection to Amazon Bedrock severed.";
        return newArr;
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`flex flex-col h-full w-full bg-white/70 backdrop-blur-3xl rounded-[2rem] border border-blue-100 shadow-[0_20px_60px_-15px_rgba(59,130,246,0.1)] overflow-hidden pointer-events-auto transition-all`}>
      {/* Header */}
      <div className="bg-white/80 border-b border-slate-100 px-6 py-5 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm" style={{ backgroundColor: `${brandColor}15`, color: brandColor, borderColor: `${brandColor}30` }}>
                <Bot className="w-5 h-5" />
            </div>
            <div>
               <h3 className="font-bold text-slate-800 tracking-tight">{agentName}</h3>
               <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Platform Online
               </p>
            </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="p-2 text-slate-400 rounded-lg transition font-medium text-xs flex items-center gap-2 hover:bg-slate-50" style={{ ':hover': { color: brandColor } } as any}>
            <RefreshCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50" ref={scrollRef}>
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              key={i} 
              className={`flex gap-3 items-end ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "user" ? (
                 <div className="flex gap-4 flex-row-reverse w-full">
                   <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                     <User className="w-4 h-4" />
                   </div>
                   <div className="text-white px-5 py-4 rounded-3xl rounded-tr-sm max-w-[80%] shadow-lg shadow-slate-200" style={{ backgroundColor: brandColor }}>
                     <p className="text-[15px] font-medium leading-relaxed">{msg.content || '...'}</p>
                   </div>
                 </div>
              ) : (
                 <div className="flex gap-4 w-full">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${brandColor}15`, color: brandColor, borderColor: `${brandColor}30` }}>
                     <Bot className="w-4 h-4" />
                   </div>
                   <div className="bg-white border border-slate-200 text-slate-700 px-5 py-4 rounded-3xl rounded-tl-sm max-w-[85%] shadow-sm w-full">
                     <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content || <span className="animate-pulse font-medium" style={{ color: brandColor }}>Processing...</span>}</p>
                   </div>
                 </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Box */}
      <div className="p-5 flex flex-col shrink-0 bg-white border-t border-slate-50 relative z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
        {sources && sources.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Target Source:</span>
            <select 
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="text-xs font-bold bg-slate-100/50 text-slate-600 rounded-lg px-3 py-1.5 outline-none border border-slate-200 cursor-pointer hover:bg-slate-100 transition max-w-[200px] truncate"
            >
              <option value="">All Memory (Global)</option>
              {sources.map((s: any) => (
                <option key={s.SK} value={s.url}>{s.url.replace('Raw Text: ', '').replace('PDF: ', '')}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="mb-4 relative flex items-center shadow-sm rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <input 
            type="text" 
            disabled={isTyping}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={hasSources ? "Ask your agent a question..." : "Sync data to unlock..."}
            className="w-full bg-transparent px-5 py-4 outline-none font-medium text-slate-700 placeholder-slate-400"
          />
          <button 
            disabled={isTyping || !input.trim() || !hasSources}
            onClick={sendMessage}
            className="absolute right-2 p-2.5 text-white rounded-xl disabled:opacity-50 disabled:bg-slate-300 transition shadow-md"
            style={{ backgroundColor: isTyping || !input.trim() || !hasSources ? undefined : brandColor }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <a href="https://vegarag.com" target="_blank" rel="noreferrer" className="text-center text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition flex items-center justify-center gap-1">
           <Zap className="w-3 h-3" style={{ color: brandColor }} /> Powered by <span style={{ color: brandColor }}>VegaRAG</span>
        </a>
      </div>
    </div>
  );
}
