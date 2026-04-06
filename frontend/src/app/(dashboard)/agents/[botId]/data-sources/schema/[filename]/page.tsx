"use client";
import { use, useState, useEffect } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { ArrowLeft, Database, Save, Loader2, CheckCircle2, Info } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SchemaEditorPage({ params }: { params: any }) {
  const { botId, filename } = use<{ botId: string; filename: string }>(params);
  const decodedFilename = decodeURIComponent(filename);

  const { data: tableDetails, isLoading } = useSWR(
    botId && decodedFilename
      ? `${api.baseUrl}/api/${botId}/tables/${encodeURIComponent(decodedFilename)}`
      : null,
    fetcher
  );


  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // Populate with existing explanations once data loads
  useEffect(() => {
    if (tableDetails?.schema_explanations) {
      setExplanations(tableDetails.schema_explanations);
    }
  }, [tableDetails]);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedOk(false);
    try {
      await api.tables.updateSchema(botId, decodedFilename, explanations);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!tableDetails) {
    return (
      <div className="p-10 text-center text-slate-500 font-medium">
        Table not found.{" "}
        <Link href={`/agents/${botId}/data-sources`} className="text-blue-600 underline">
          Go back
        </Link>
      </div>
    );
  }

  const columns: string[] = tableDetails.columns ?? [];

  return (
    <div className="p-10 max-w-4xl mx-auto w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/agents/${botId}/data-sources`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Data Sources
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          Schema Editor
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          <span className="font-bold text-slate-700">{decodedFilename}</span> &mdash;{" "}
          {tableDetails.row_count?.toLocaleString()} rows
        </p>

        {/* Info banner */}
        <div className="flex items-start gap-3 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 font-medium">
            Add plain-English descriptions for each column so the AI understands what your data
            means. For example, <em>"c_rev" → "Total customer revenue in USD"</em>. The more
            context you provide, the better the SQL queries will be.
          </p>
        </div>
      </div>

      {/* Columns Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="sticky top-0 z-20 px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white/90 backdrop-blur-md rounded-t-3xl">
          <h2 className="font-bold text-slate-800 text-lg">
            {columns.length} Column{columns.length !== 1 ? "s" : ""}
          </h2>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow disabled:opacity-50 transition"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : savedOk ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {savedOk ? "Saved!" : "Save Descriptions"}
          </motion.button>
        </div>

        <div className="divide-y divide-slate-50">
          {columns.map((col, idx) => (
            <motion.div
              key={col}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="grid grid-cols-5 gap-6 items-center px-8 py-5 hover:bg-slate-50 transition"
            >
              {/* Column name */}
              <div className="col-span-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Column</p>
                <p className="font-bold text-slate-800 font-mono text-sm truncate">{col}</p>
              </div>

              {/* Description input */}
              <div className="col-span-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Description (for AI)</p>
                <input
                  type="text"
                  value={explanations[col] ?? ""}
                  onChange={(e) =>
                    setExplanations((prev) => ({ ...prev, [col]: e.target.value }))
                  }
                  placeholder={`e.g. "Monthly revenue in USD"`}
                  className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition placeholder-slate-400 text-slate-700"
                />
              </div>
            </motion.div>
          ))}
        </div>


      </div>
    </div>
  );
}
