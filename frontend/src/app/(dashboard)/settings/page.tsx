"use client";

import { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Key, 
  Shield, 
  Users, 
  Save, 
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [activeTab] = useState("general");

  const tabs = [
    { id: "general", name: "General", icon: SettingsIcon },
    { id: "api", name: "API Keys", icon: Key },
    { id: "security", name: "Security", icon: Shield },
    { id: "team", name: "Team", icon: Users },
  ];

  return (
    <div className="p-10 max-w-5xl mx-auto w-full h-full overflow-hidden relative">
      {/* "Coming Soon" Blurred Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[8px] bg-white/40 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 bg-white/95 border border-blue-100 rounded-[3rem] shadow-[0_20px_50px_rgba(37,99,235,0.15)] text-center max-w-lg"
        >
          <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Adding More Features</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-8 text-lg">
            Soon you'll be able to add your own <span className="text-slate-900 font-bold">Amazon Bedrock</span> and <span className="text-slate-900 font-bold">Pinecone</span> API keys to connect directly and use the platform entirely for free.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-black rounded-full text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20">
            Coming Soon
          </div>
        </motion.div>
      </div>

      <div className="opacity-30 pointer-events-none filter blur-[3px] select-none">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-blue-600" /> Workspace Settings
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Manage your workspace configuration and global API integrations.</p>
          </div>
          <button 
            disabled={true}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl transition shadow-lg opacity-50"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </header>

        <div className="flex gap-8">
          {/* Tab Sidebar */}
          <div className="w-48 shrink-0 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                disabled={true}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" 
                    : "text-slate-500"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Tab Content Placeholder */}
          <div className="flex-1 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
            <div className="space-y-6">
              <div className="w-full h-8 bg-slate-100 rounded-lg animate-pulse" />
              <div className="w-2/3 h-8 bg-slate-100 rounded-lg animate-pulse" />
              <div className="w-full h-48 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
