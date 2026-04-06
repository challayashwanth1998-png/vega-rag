"use client";
import Link from "next/link";
import { use, useRef, useState } from "react";
import useSWR from "swr";
import {
  Database, Link2, Loader2, Globe, FileText, CheckCircle2,
  Upload, X, TableProperties, FileSpreadsheet, Pencil, Save, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type SourceRecord } from "@/lib/api";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "link" | "text" | "pdf" | "table";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "link",  label: "Website URL",   icon: Globe },
  { id: "text",  label: "Raw Text",      icon: FileText },
  { id: "pdf",   label: "PDF Upload",    icon: FileText },
  { id: "table", label: "CSV / Excel",   icon: FileSpreadsheet },
];

export default function DataSourcesPage({ params }: { params: any }) {
  const resolvedParams: any = use(params);
  const botId = resolvedParams.botId;

  const [activeTab, setActiveTab]       = useState<Tab>("link");
  const [urlInput, setUrlInput]         = useState("");
  const [textTitle, setTextTitle]       = useState("");
  const [textContent, setTextContent]   = useState("");
  const [pdfFile, setPdfFile]           = useState<File | null>(null);
  const [tableFile, setTableFile]       = useState<File | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");

  const [schemaModalFile, setSchemaModalFile] = useState<string | null>(null);
  const [schemaColumns, setSchemaColumns] = useState<string[]>([]);
  const [schemaExplanations, setSchemaExplanations] = useState<Record<string, string>>({});
  const [isSavingSchema, setIsSavingSchema] = useState(false);

  const pdfInputRef   = useRef<HTMLInputElement>(null);
  const tableInputRef = useRef<HTMLInputElement>(null);

  const { data: sources, mutate } = useSWR<SourceRecord[]>(
    `${api.baseUrl}/api/agents/${botId}/sources`,
    fetcher,
    { refreshInterval: 2000 }
  );

  const reset = () => { setErrorMsg(""); };

  const addOptimistic = (url: string, sk: string) => {
    const opt: SourceRecord = { SK: sk, url, status: "Syncing...", chunks: 0 };
    const filteredSources = (sources ?? []).filter(s => s.SK !== sk);
    mutate([opt, ...filteredSources], false);
  };

  const saveSchema = async () => {
    if (!schemaModalFile) return;
    setIsSavingSchema(true);
    try {
      await api.tables.updateSchema(botId, schemaModalFile, schemaExplanations);
      setSchemaModalFile(null);
    } catch (e: any) {
      setErrorMsg("Failed to save schema: " + e.message);
    }
    setIsSavingSchema(false);
  };

  const handleDeleteSource = async (sk: string) => {
    if (!confirm("Are you sure you want to permanently delete this data source?")) return;
    
    // Optimistic deletion
    const filteredSources = (sources ?? []).filter((s) => s.SK !== sk);
    mutate(filteredSources, false);

    try {
      await api.agents.deleteSource(botId, sk);
    } catch (e: any) {
      setErrorMsg("Failed to delete source: " + e.message);
    }
    mutate();
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCrawl = async () => {
    if (!urlInput.trim() || isSubmitting) return;
    setIsSubmitting(true); reset();
    addOptimistic(urlInput, `SOURCE#${urlInput}`);
    try {
      await api.ingestion.crawlUrl(urlInput.trim(), botId);
      setUrlInput("");
    } catch (e: any) { setErrorMsg(e.message); }
    mutate(); setIsSubmitting(false);
  };

  const handleTextSync = async () => {
    if (!textTitle.trim() || !textContent.trim() || isSubmitting) return;
    setIsSubmitting(true); reset();
    addOptimistic(`Raw Text: ${textTitle}`, `SOURCE#TEXT#${textTitle}`);
    try {
      await api.ingestion.ingestText(textTitle.trim(), textContent.trim(), botId);
      setTextTitle(""); setTextContent("");
    } catch (e: any) { setErrorMsg(e.message); }
    mutate(); setIsSubmitting(false);
  };

  const handleFileUpload = async (file: File | null, uploadFn: (f: File, id: string) => Promise<Response>, skPrefix: string, label: string, clearFn: () => void) => {
    if (!file || isSubmitting) return;
    setIsSubmitting(true); reset();
    addOptimistic(`${label}: ${file.name}`, `${skPrefix}${file.name}`);
    try {
      const res = await uploadFn(file, botId);
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail ?? "Upload failed"); }
      
      let data = null;
      try { data = await res.json(); } catch (e) { }
      clearFn();

      if (label === "Table" && data && data.columns && data.filename) {
          setSchemaModalFile(data.filename);
          setSchemaColumns(data.columns);
          setSchemaExplanations({});
      }
    } catch (e: any) { setErrorMsg(e.message); }
    mutate(); setIsSubmitting(false);
  };

  const onDrop = (e: React.DragEvent, accept: string[], setFn: (f: File) => void) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && accept.some(ext => f.name.toLowerCase().endsWith(ext))) {
      setFn(f); reset();
    } else {
      setErrorMsg(`Accepted formats: ${accept.join(", ")}`);
    }
  };

  // ── Sub-components ──────────────────────────────────────────────────────────

  const DropZone = ({ file, setFile, accept, acceptLabel, inputRef }: {
    file: File | null; setFile: (f: File) => void;
    accept: string[]; acceptLabel: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => onDrop(e, accept, setFile)}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
        isDragging ? "border-blue-500 bg-blue-50 scale-[1.01]"
        : file ? "border-emerald-400 bg-emerald-50"
        : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
      }`}
    >
      <input ref={inputRef} type="file" accept={accept.map(e => `.${e}`).join(",")} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); reset(); } }} />
      {file ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
          <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
          <button onClick={(e) => { e.stopPropagation(); setFile(null as any); }}
            className="mt-1 text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1">
            <X className="w-3 h-3" /> Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Upload className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">Drop a file here or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">{acceptLabel}</p>
          </div>
        </div>
      )}
    </div>
  );

  const SubmitBtn = ({ disabled, label, loadingLabel }: { disabled: boolean; label: string; loadingLabel?: string }) => (
    <button disabled={disabled || isSubmitting} onClick={() => {}}
      className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2">
      {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> {loadingLabel ?? "Processing..."}</> : label}
    </button>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  const sourceIcon = (s: SourceRecord) => {
    if (s.url?.startsWith("Table:") || s.url?.startsWith("CSV:")) return <TableProperties className="w-5 h-5" />;
    if (s.url?.startsWith("PDF:") || s.url?.startsWith("Raw Text:")) return <FileText className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  return (
    <div className="p-10 max-w-5xl mx-auto w-full h-full overflow-y-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" /> Data Sources
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Embed documents into Pinecone memory, or upload CSV/Excel for live SQL querying.
        </p>
        {/* Architecture badge */}
        <div className="flex flex-wrap gap-2 mt-3">
          {["S3 Archive", "Bedrock Titan Embed", "Pinecone Vectors", "DuckDB SQL"].map(b => (
            <span key={b} className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider">{b}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Input Panel ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-fit">
          {/* Tab switcher */}
          <div className="grid grid-cols-4 bg-slate-100 p-1.5 rounded-xl mb-6 gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); reset(); }}
                className={`flex flex-col items-center gap-1 py-2 px-1 text-[10px] font-bold rounded-lg transition ${
                  activeTab === t.id ? "bg-white shadow-sm text-blue-700" : "text-slate-500 hover:text-slate-700"
                }`}>
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold">
                <X className="w-4 h-4 shrink-0 mt-0.5" /> {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* URL Tab */}
          {activeTab === "link" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Target URL</label>
                <div className="relative flex items-center">
                  <Link2 className="absolute left-4 w-5 h-5 text-slate-400" />
                  <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
                    placeholder="https://..."
                    className="w-full py-3.5 pl-12 pr-4 font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 placeholder-slate-400" />
                </div>
              </div>
              <button disabled={isSubmitting || !urlInput} onClick={handleCrawl}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Fetch & Vectorize"}
              </button>
            </div>
          )}

          {/* Text Tab */}
          {activeTab === "text" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Document Title</label>
                <input type="text" value={textTitle} onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="e.g. Employee Handbook"
                  className="w-full py-3.5 px-4 font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 placeholder-slate-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Content</label>
                <textarea rows={5} value={textContent} onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste the knowledge here..."
                  className="w-full py-3.5 px-4 font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 placeholder-slate-400 resize-none" />
              </div>
              <button disabled={isSubmitting || !textTitle || !textContent} onClick={handleTextSync}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Embed into Memory"}
              </button>
            </div>
          )}

          {/* PDF Tab */}
          {activeTab === "pdf" && (
            <div className="space-y-4">
              <DropZone file={pdfFile} setFile={setPdfFile} accept={["pdf"]}
                acceptLabel="PDF only — stored in S3, extracted with pypdf → Bedrock → Pinecone"
                inputRef={pdfInputRef} />
              <button disabled={isSubmitting || !pdfFile}
                onClick={() => handleFileUpload(pdfFile, api.ingestion.uploadPdf, "SOURCE#PDF#", "PDF", () => setPdfFile(null))}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <><Upload className="w-5 h-5" /> Upload & Embed PDF</>}
              </button>
            </div>
          )}

          {/* CSV / Excel Tab */}
          {activeTab === "table" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-bold flex items-start gap-2">
                <TableProperties className="w-4 h-4 shrink-0 mt-0.5" />
                <span>CSV/Excel files are SQL-queryable. Ask questions like <em>"What is the total revenue by region?"</em> and the agent will run a live SQL query on your data.</span>
              </div>
              <DropZone file={tableFile} setFile={setTableFile} accept={["csv", "xlsx", "xls"]}
                acceptLabel="CSV, XLSX, XLS — stored in S3, queryable via DuckDB SQL"
                inputRef={tableInputRef} />
              <button disabled={isSubmitting || !tableFile}
                onClick={() => handleFileUpload(tableFile, api.ingestion.uploadTable, "SOURCE#TABLE#", "Table", () => setTableFile(null))}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <><FileSpreadsheet className="w-5 h-5" /> Upload & Register Table</>}
              </button>
            </div>
          )}
        </div>

        {/* ── Sources Panel ────────────────────────────────────────────────── */}
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
            Synced Memory
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
              {sources?.length ?? 0} Sources
            </span>
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {(sources?.length ?? 0) === 0 && (
                <div className="text-center py-10 text-slate-400 font-medium text-sm">No sources yet.</div>
              )}
              {sources?.map((s) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={s.SK}
                  className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`p-2.5 rounded-lg shrink-0 ${s.status === "Synced" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400 animate-pulse"}`}>
                      {sourceIcon(s)}
                    </div>
                    <div className="truncate pr-4">
                      <p className="text-sm font-bold text-slate-800 truncate">{s.url}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {s.url?.startsWith("Table:") ? `${s.chunks ?? 0} rows` : `${s.chunks ?? 0} vectors`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleDeleteSource(s.SK)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition" title="Delete Source">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {(s.url?.startsWith("Table:") || s.url?.startsWith("CSV:")) && s.status === "Synced" && (
                      <Link
                        href={`/agents/${botId}/data-sources/schema/${encodeURIComponent(s.url.replace("Table: ", "").replace("CSV: ", ""))}`}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md uppercase tracking-wider transition"
                      >
                        <Pencil className="w-3 h-3" /> Schema
                      </Link>
                    )}
                  {s.status === "Synced" ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-md shrink-0 uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                    </span>
                  ) : s.status === "Failed" ? (
                    <span className="text-[11px] font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-md shrink-0 uppercase tracking-wider">Failed</span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-md shrink-0 uppercase tracking-wider flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing
                    </span>
                  )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Schema Explanation Modal ── */}
      <AnimatePresence>
        {schemaModalFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Map Table Columns</h2>
                  <p className="text-sm text-slate-500 mt-1">Provide plain-English context to help the SQL agent understand your data.</p>
                </div>
                <button onClick={() => setSchemaModalFile(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg border border-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 min-h-0">
                <div className="space-y-4">
                  {schemaColumns.map((col) => (
                    <div key={col} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                      <div className="w-full md:w-1/3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Column Name</span>
                        <code className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md max-w-full block truncate" title={col}>{col}</code>
                      </div>
                      <div className="w-full md:w-2/3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">AI Description</span>
                        <input 
                           type="text" 
                           placeholder="e.g. Total order amount in USD"
                           value={schemaExplanations[col] || ""}
                           onChange={e => setSchemaExplanations(prev => ({ ...prev, [col]: e.target.value }))}
                           className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-700 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                <button onClick={() => setSchemaModalFile(null)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                  I'll do it later
                </button>
                <button onClick={saveSchema} disabled={isSavingSchema} className="px-8 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2">
                  {isSavingSchema ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Schema
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
