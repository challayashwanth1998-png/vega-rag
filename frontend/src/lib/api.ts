/**
 * Centralized API client for VegaRAG backend.
 *
 * Local dev:  Uses Next.js rewrites (/api proxy) if variables are unset.
 * Production: Uses relative paths (e.g. /api/agents) by default.
 *             Optionally override with NEXT_PUBLIC_API_URL for cross-domain.
 *
 * Usage:
 *   import { api } from "@/lib/api";
 *   const agents = await api.agents.list(userEmail);
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_APIBASEURL ?? "";

// ── Generic helpers ────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.statusText}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.statusText}`);
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.statusText}`);
  return res.json();
}

// ── Typed API surface ─────────────────────────────────────────────────────

export const api = {
  // Raw base URL (used for SWR fetcher keys and SSE streams)
  baseUrl: BASE_URL,

  agents: {
    list: (userEmail: string) =>
      get<AgentRecord[]>(`/api/agents?user_email=${encodeURIComponent(userEmail)}`),

    create: (name: string, userEmail: string) =>
      post<AgentRecord>("/api/agents", { name, user_email: userEmail }),

    sources: (botId: string) =>
      get<SourceRecord[]>(`/api/agents/${botId}/sources`),

    deleteSource: (botId: string, sk: string) =>
      fetch(`${BASE_URL}/api/agents/${botId}/sources/${encodeURIComponent(sk)}`, { method: "DELETE" }).then(r => r.json()),

    getUsers: (botId: string) =>
      get<any[]>(`/api/agents/${botId}/users`),

    addUser: (botId: string, email: string, pass: string) =>
      post<{status:string}>(`/api/agents/${botId}/users`, { email, password: pass }),

    deleteUser: (botId: string, email: string) =>
      fetch(`${BASE_URL}/api/agents/${botId}/users/${encodeURIComponent(email)}`, { method: "DELETE" }).then(r => r.json()),

    getUserRestrictions: (botId: string, email: string) =>
      get<{ restricted_tables: string[] }>(`/api/agents/${botId}/users/${encodeURIComponent(email)}/restrictions`),

    updateUserRestrictions: (botId: string, email: string, restricted_tables: string[]) =>
      put<{ status: string }>(`/api/agents/${botId}/users/${encodeURIComponent(email)}/restrictions`, { restricted_tables }),

    listTables: (botId: string) =>
      get<TableRecord[]>(`/api/agents/${botId}/tables`),

    analytics: (botId: string) =>
      get<AnalyticsRecord[]>(`/api/agents/${botId}/analytics`),

    activity: (botId: string) =>
      get<ActivityRecord[]>(`/api/agents/${botId}/activity`),

    getConfig: (botId: string) =>
      get<AgentConfig>(`/api/agents/${botId}/config`),

    updateConfig: (botId: string, config: AgentConfig) =>
      put<{ status: string }>(`/api/agents/${botId}/config`, config),

    getWorkflow: (botId: string) =>
      get<WorkflowState>(`/api/agents/${botId}/workflow`),

    saveWorkflow: (botId: string, nodes: unknown[], edges: unknown[]) =>
      put<{ status: string }>(`/api/agents/${botId}/workflow`, { nodes, edges }),
  },

  ingestion: {
    crawlUrl: (url: string, botId: string) =>
      post<{ status: string; chunks_memorized: number }>("/api/crawl", { url, bot_id: botId }),

    ingestText: (title: string, textContent: string, botId: string) =>
      post<{ status: string; chunks_memorized: number }>("/api/text", {
        title,
        text_content: textContent,
        bot_id: botId,
      }),

    /** Multipart PDF upload — returns fetch Response so caller can handle streaming status */
    uploadPdf: (file: File, botId: string): Promise<Response> => {
      const form = new FormData();
      form.append("file", file);
      form.append("bot_id", botId);
      return fetch(`${BASE_URL}/api/pdf`, { method: "POST", body: form });
    },

    /** Multipart CSV/Excel upload for SQL querying via DuckDB */
    uploadTable: (file: File, botId: string): Promise<Response> => {
      const form = new FormData();
      form.append("file", file);
      form.append("bot_id", botId);
      return fetch(`${BASE_URL}/api/table`, { method: "POST", body: form });
    },
  },

  tables: {
    getDetails: (botId: string, filename: string) =>
      get<TableDetailsRecord>(`/api/${botId}/tables/${encodeURIComponent(filename)}`),

    updateSchema: (botId: string, filename: string, explanations: Record<string, string>) =>
      put<{ status: string }>(`/api/${botId}/tables/${encodeURIComponent(filename)}/schema`, {
        schema_explanations: explanations,
      }),
  },

  /** Returns a raw EventSource URL for the chat SSE stream */
  chatStreamUrl: (): string => `${BASE_URL}/api/chat`,
};

// ── Shared TypeScript types ───────────────────────────────────────────────

export interface AgentRecord {
  bot_id: string;
  name: string;
  status: string;
  createdAt: string;
  user_email?: string;
}

export interface SourceRecord {
  SK: string;
  url: string;
  status: "Syncing..." | "Synced" | "Failed";
  chunks: number;
  s3_uri?: string;
  createdAt?: string;
}

export interface TableDetailsRecord {
  filename: string;
  table_name: string;
  columns: string[];
  row_count: number;
  schema_explanations?: Record<string, string>;
}

export interface TableRecord {
  SK: string;
  filename: string;
  table_name: string;
  columns: string[];
  row_count: number;
  createdAt?: string;
}

export interface AnalyticsRecord {

  name: string;
  raw_date: string;
  queries: number;
}

export interface ActivityRecord {
  SK: string;
  session_id: string;
  user_msg: string;
  ai_response: string;
  timestamp: string;
}

export interface AgentConfig {
  system_prompt: string;
  brand_color: string;
  name: string;
}

export interface WorkflowState {
  nodes: unknown[];
  edges: unknown[];
}
