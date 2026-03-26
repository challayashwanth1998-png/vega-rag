"use client";
import { use, useState } from "react";
import useSWR from "swr";
import { Database, Link2, Loader2, Globe, FileText, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DataSourcesPage({ params }: { params: any }) {
  const resolvedParams: any = use(params);
  const botId = resolvedParams.botId;

  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<'link'|'text'>('link');
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  
  const { data: sources, mutate } = useSWR(`http://localhost:8000/api/agents/${botId}/sources`, fetcher, { refreshInterval: 2000 });

  const handleCrawl = async () => {
    if (!urlInput.trim() || isCrawling) return;
    setIsCrawling(true);
    const optimisticData = [{ SK: `SOURCE#${urlInput}`, url: urlInput, status: "Syncing...", chunks: 0 }, ...(sources || [])];
    mutate(optimisticData, false);
    try {
       await fetch("http://localhost:8000/api/crawl", {
         method: "POST",
         headers: {"Content-Type": "application/json"},
         body: JSON.stringify({ url: urlInput.trim(), bot_id: botId })
       });
       setUrlInput("");
       window.dispatchEvent(new Event("memory-synced"));
    } catch(e) {}
    mutate();
    setIsCrawling(false);
  };

  const handleTextSync = async () => {
    if (!textTitle.trim() || !textContent.trim() || isCrawling) return;
    setIsCrawling(true);
    const optimisticData = [{ SK: `SOURCE#TEXT#${textTitle}`, url: `Raw Text: ${textTitle}`, status: "Syncing...", chunks: 0 }, ...(sources || [])];
    mutate(optimisticData, false);
    try {
       await fetch("http://localhost:8000/api/text", {
         method: "POST",
         headers: {"Content-Type": "application/json"},
         body: JSON.stringify({ title: textTitle.trim(), text_content: textContent.trim(), bot_id: botId })
       });
       setTextTitle("");
       setTextContent("");
       window.dispatchEvent(new Event("memory-synced"));
    } catch(e) {}
    mutate(); 
    setIsCrawling(false);
  };

  return (
    <div className="p-10 max-w-5xl mx-auto w-full h-full overflow-y-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" /> Data Sources
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Embed links and files into your Agent's memory.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Input Form Column */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-fit">
           <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6">
             <button onClick={() => setActiveTab('link')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${activeTab === 'link' ? "bg-white shadow-sm text-blue-700" : "text-slate-500 hover:text-slate-700"}`}>Website Link</button>
             <button onClick={() => setActiveTab('text')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${activeTab === 'text' ? "bg-white shadow-sm text-blue-700" : "text-slate-500 hover:text-slate-700"}`}>Raw Text</button>
           </div>

           {activeTab === 'link' ? (
             <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Target URL</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Link2 className="w-5 h-5" /></div>
                    <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCrawl()} placeholder="https://..." className="w-full py-3.5 pl-12 pr-4 font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400" />
                  </div>
               </div>
               <button disabled={isCrawling || !urlInput} onClick={handleCrawl} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2">
                 {isCrawling ? <Loader2 className="w-5 h-5 animate-spin" /> : "Fetch and Vectorize Link"}
               </button>
             </div>
           ) : (
             <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Document Title</label>
                  <input type="text" value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="e.g. Employee Handbook" className="w-full py-3.5 px-4 font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400" />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Raw Textual Data</label>
                  <textarea rows={5} value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Paste the exact knowledge here..." className="w-full py-3.5 px-4 font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400 resize-none" />
               </div>
               <button disabled={isCrawling || !textTitle || !textContent} onClick={handleTextSync} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2">
                 {isCrawling ? <Loader2 className="w-5 h-5 animate-spin" /> : "Embed Text into Memory"}
               </button>
             </div>
           )}
        </div>

        {/* List Tracker Column */}
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
              Synced Memory
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">{sources?.length || 0} Files</span>
           </h3>
           <div className="space-y-3">
             <AnimatePresence>
               {sources?.length === 0 && (
                 <div className="text-center py-10 text-slate-400 font-medium">No vectors found in Pinecone.</div>
               )}
               {sources?.map((source: any, i: number) => (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={source.SK} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 transition">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`p-2.5 rounded-lg ${source.status === 'Synced' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400 animate-pulse'}`}>
                        {source?.url?.includes('Raw Text') ? <FileText className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                      </div>
                      <div className="truncate pr-4">
                        <p className="text-sm font-bold text-slate-800 truncate">{source?.url}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">{source?.chunks || 0} Vectors</p>
                      </div>
                    </div>
                    {source.status === 'Synced' ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-md shrink-0 uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5"/> Synced</span>
                    ) : source.status === 'Failed' ? (
                      <span className="text-[11px] font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-md shrink-0 uppercase tracking-wider">Failed</span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-md shrink-0 uppercase tracking-wider flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin"/> Syncing</span>
                    )}
                 </motion.div>
               ))}
             </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
}
