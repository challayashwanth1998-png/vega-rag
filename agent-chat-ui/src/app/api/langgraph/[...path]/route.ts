import { NextRequest } from "next/server";
import pino from "pino";

const logger = pino({ name: "vega.chat.ui", level: process.env.LOG_LEVEL || "info" });


const VEGARAG_URL = process.env.VEGARAG_BACKEND_URL || "http://localhost:8000";

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Server-side in-memory cache of the last stream result per thread.
 * Solves the DynamoDB write race condition:
 *   - Backend writes activity to DynamoDB AFTER stream closes
 *   - GET /state is called immediately after stream ends
 *   - Without cache: GET /state finds incomplete data → blank UI
 *   - With cache: GET /state returns exact messages from last stream → stable UI
 */
const streamCache = new Map<string, { messages: any[]; ts: number }>();
const CACHE_TTL_MS = 60_000; // 60s — enough for any normal GET /state call

function cacheSet(threadId: string, messages: any[]) {
  streamCache.set(threadId, { messages, ts: Date.now() });
}

function cacheGet(threadId: string): any[] | null {
  const entry = streamCache.get(threadId);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    streamCache.delete(threadId);
    return null;
  }
  return entry.messages;
}

async function* parseSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<string> {
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let boundary: number;
    while ((boundary = buf.indexOf("\n\n")) !== -1) {
      const block = buf.slice(0, boundary);
      buf = buf.slice(boundary + 2);
      for (const line of block.split("\n")) {
        if (line.startsWith("data: ")) yield line.slice(6).trim();
      }
    }
  }
  for (const line of buf.split("\n")) {
    if (line.startsWith("data: ")) yield line.slice(6).trim();
  }
}

function buildExchangeMessages(act: {
  SK: string;
  user_msg: string;
  ai_response: string;
  intent?: string;
}) {
  const sk = act.SK;
  const toolCallId = `tc-${sk}`;
  const intent = act.intent ?? "rag";
  const toolArgs = { intent };
  // Guard against any cached "undefined" string prepended in previous buggy turns
  let aiContent = act.ai_response || "";
  if (aiContent.startsWith("undefined")) {
    aiContent = aiContent.replace(/^undefined/, "");
  }
  return [
    { id: `human-${sk}`, type: "human", content: act.user_msg || "" },
    {
      id: `ai-${sk}`, type: "ai", content: aiContent,
      tool_calls: [{ id: toolCallId, name: "VegaRAG_Executor", type: "tool_call", args: toolArgs }],
    },
    { id: `tool-${sk}`, type: "tool", name: "VegaRAG_Executor", tool_call_id: toolCallId, content: JSON.stringify(toolArgs) },
  ];
}

async function fetchActivities(thread_id: string): Promise<any[]> {
  try {
    const resp = await fetch(`${VEGARAG_URL}/api/activity/session/${thread_id}`);
    if (resp.ok) return await resp.json();
  } catch (e) {
    logger.error({ err: e, threadId: thread_id }, "[fetchActivities] failed");
  }
  return [];
}

/** Fetch activities, retrying until we have at least `minCount` results. */
async function fetchActivitiesMinCount(thread_id: string, minCount: number): Promise<any[]> {
  const delays = [500, 1000, 1500, 2000, 2000];
  for (let i = 0; i <= delays.length; i++) {
    const activities = await fetchActivities(thread_id);
    if (activities.length >= minCount) return activities;
    if (i < delays.length) await sleep(delays[i]);
  }
  return await fetchActivities(thread_id); // final attempt
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");

  if (path === "info") return Response.json({ version: "1.0.0" });
  if (path === "threads") return Response.json([]);

  // GET /threads/{id}/state — called immediately after stream ends.
  // 1. First try the stream cache (exact messages from last stream, no race condition).
  // 2. Fall back to DynamoDB with retry for page reloads / history loads.
  if (path.startsWith("threads/") && path.endsWith("/state")) {
    const thread_id = resolvedParams.path[1];

    // Cache hit: return same messages that were streamed (IDs are consistent)
    const cached = cacheGet(thread_id);
    if (cached) {
      logger.info({ threadId: thread_id, msgsCount: cached.length }, "[GET /state] cache hit");
      return Response.json({
        values: { messages: cached },
        next: [],
        metadata: {},
        config: { configurable: { thread_id } },
      });
    }

    // Cache miss: fetch from DynamoDB (happens on page reload / fresh loads)
    try {
      const activities = await fetchActivitiesMinCount(thread_id, 1);
      if (activities.length > 0) {
        const messages: any[] = activities.flatMap((a: any) => buildExchangeMessages(a));
        logger.info({ threadId: thread_id, activitiesCount: activities.length, msgsCount: messages.length }, "[GET /state] DynamoDB loaded");
        return Response.json({
          values: { messages },
          next: [],
          metadata: {},
          created_at: activities[0].timestamp,
          config: { configurable: { thread_id } },
        });
      }
    } catch (e) {
      logger.error({ err: e, threadId: thread_id }, "[GET /state] error");
    }
    return Response.json({ values: { messages: [] }, next: [] });
  }

  // GET /threads/{id}
  if (path.match(/^threads\/[^/]+$/) && !path.includes("history")) {
    const thread_id = resolvedParams.path[1];
    return Response.json({ thread_id, metadata: {}, created_at: new Date().toISOString(), status: "idle" });
  }

  logger.info({ path }, "[GET fallback]");
  return Response.json({}, { status: 200 });
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");

  if (path === "threads") {
    return Response.json({ thread_id: uuid(), created_at: new Date().toISOString(), metadata: {}, status: "idle" });
  }

  // Thread history sidebar
  if (path === "threads/search") {
    try {
      let body: any;
      try { body = await req.json(); } catch { body = {}; }
      const assistantId =
        body?.assistant_id || body?.metadata?.assistant_id ||
        body?.metadata?.graph_id || body?.graph_id || "bot_default";
      const response = await fetch(`${VEGARAG_URL}/api/agents/${assistantId}/activity`);
      if (response.ok) {
        const activities = await response.json();
        const seen = new Set<string>();
        const threads: any[] = [];
        for (const act of [...activities].reverse()) {
          if (!seen.has(act.session_id)) {
            seen.add(act.session_id);
            threads.push({
              thread_id: act.session_id,
              created_at: act.timestamp,
              updated_at: act.timestamp,
              metadata: { graph_id: assistantId, assistant_id: assistantId },
              status: "idle",
              values: { messages: [{ id: `human-${act.SK}`, type: "human", content: act.user_msg || "" }] },
            });
          }
        }
        return Response.json(threads.reverse());
      }
    } catch (e) {
      logger.error({ err: e }, "[threads/search] error");
    }
    return Response.json([]);
  }

  // Thread history checkpoints
  if (path.endsWith("/history")) {
    const thread_id = resolvedParams.path[1];
    try {
      const activities = await fetchActivities(thread_id);
      if (activities.length > 0) {
        const checkpoints: any[] = [];
        for (let i = 0; i < activities.length; i++) {
          const msgs: any[] = [];
          for (let j = 0; j <= i; j++) msgs.push(...buildExchangeMessages(activities[j]));
          checkpoints.push({
            values: { messages: msgs },
            next: [],
            metadata: { step: i },
            created_at: activities[i].timestamp,
            // SDK's getBranchSequence requires checkpoint.checkpoint_id to traverse the tree.
            // Without it, items with history.length > 1 are SKIPPED → threadHead = undefined
            // → historyValues = {} → messages = [] → blank page after turn 2.
            checkpoint: { checkpoint_id: `ckpt-${i}`, thread_id },
            parent_checkpoint: i > 0 ? { checkpoint_id: `ckpt-${i - 1}` } : null,
            config: { configurable: { thread_id, checkpoint_id: `ckpt-${i}` } },
          });
        }
        return Response.json(checkpoints.reverse());
      }
    } catch (e) {
      logger.error({ err: e, threadId: thread_id }, "[history] error");
    }
    return Response.json([]);
  }

  // ── STREAM ────────────────────────────────────────────────────────────────
  if (path.startsWith("threads/") && path.endsWith("/runs/stream")) {
    const thread_id = resolvedParams.path[1];
    let body: any;
    try { body = await req.json(); } catch { body = {}; }

    const inputMessages: any[] = body?.input?.messages || [];
    const lastMsg = inputMessages[inputMessages.length - 1];

    let query = "Hello";
    if (lastMsg?.content) {
      if (Array.isArray(lastMsg.content)) {
        query = lastMsg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ");
      } else {
        query = lastMsg.content;
      }
    }

    const urlAssistantId = req.nextUrl.searchParams.get("assistant_id");
    const bot_id = body?.assistant_id || urlAssistantId || "bot_default";

    // Fetch all completed previous turns for this session.
    // On turn N, this returns N-1 completed activities (current turn not saved yet).
    let prevMessages: any[] = [];
    try {
      const prevActivities = await fetchActivities(thread_id);
      prevMessages = prevActivities.flatMap((a: any) => buildExchangeMessages(a));
      logger.info({ threadId: thread_id, prevActivities: prevActivities.length, prevMsgs: prevMessages.length }, "[stream] initialized");
    } catch (e) {
      logger.error({ err: e, threadId: thread_id }, "[stream] failed to fetch prev");
    }

    // Read logged-in user email from header (set by Stream.tsx via defaultHeaders)
    const userEmail = req.headers.get("x-vegarag-user-email") || undefined;
    if (userEmail) logger.info({ threadId: thread_id, userEmail }, "[stream] authenticated user");

    try {
      const backendResponse = await fetch(`${VEGARAG_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_id, session_id: thread_id, query, user_email: userEmail }),
      });

      if (!backendResponse.ok) {
        const errText = await backendResponse.text();
        logger.error({ status: backendResponse.status, errText, threadId: thread_id }, "[stream] backend error");
        return new Response(errText, { status: 500 });
      }

      const runId = uuid();
      const fakeSK = `ENTRY#${thread_id}#${runId}`;
      const toolCallMsgId = `ai-tool-${fakeSK}`;
      const toolCallId    = `tc-${fakeSK}`;
      const toolResultId  = `tool-${fakeSK}`;
      const finalMsgId    = `ai-${fakeSK}`;

      let finalMessages: any[] = [];

      const stream = new ReadableStream({
        async start(controller) {
          const reader = backendResponse.body?.getReader();
          if (!reader) return controller.close();
          const enc = new TextEncoder();

          controller.enqueue(enc.encode(`event: metadata\ndata: {"run_id": "${runId}"}\n\n`));

          let accumulatedText = "";
          let toolArgs: Record<string, unknown> | null = null;

          const buildMsgs = (text: string): any[] => {
            const msgs: any[] = [...prevMessages]; // all previous completed turns
            if (lastMsg) msgs.push(lastMsg);       // current human message (original SDK UUID)

            // Guard against any lingering 'undefined' concatenation
            let cleanText = text;
            if (cleanText.startsWith("undefined")) {
              cleanText = cleanText.replace(/^undefined/, "");
            }

            if (toolArgs !== null) {
              msgs.push({
                id: finalMsgId, type: "ai", content: cleanText,
                tool_calls: [{ id: toolCallId, name: "VegaRAG_Executor", type: "tool_call", args: toolArgs }],
              });
              msgs.push({
                id: toolResultId, type: "tool", name: "VegaRAG_Executor",
                tool_call_id: toolCallId, content: JSON.stringify(toolArgs),
              });
            } else if (cleanText.length > 0) {
              msgs.push({ id: finalMsgId, type: "ai", content: cleanText });
            }

            return msgs;
          };

          const emit = (text: string) => {
            const msgs = buildMsgs(text);
            controller.enqueue(
              enc.encode(`event: values\ndata: ${JSON.stringify({ messages: msgs })}\n\n`)
            );
          };

          for await (const dataStr of parseSseStream(reader)) {
            if (dataStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.tools) {
                // Capture intent metadata — do NOT emit yet.
                // Emitting here causes tool result messages to appear as
                // text content before the AI response starts, producing
                // the "undefined" prefix users see. Wait for real text.
                toolArgs = { intent: parsed.tools.intent ?? "rag" };
                continue;
              }
              const token = parsed.text ?? "";
              if (!token) continue;
              accumulatedText += token;
              emit(accumulatedText);
            } catch { /* skip malformed */ }
          }

          // Cache the final complete message list so GET /state can return it
          // immediately — eliminating the DynamoDB write race condition.
          finalMessages = buildMsgs(accumulatedText);
          cacheSet(thread_id, finalMessages);
          logger.info({ threadId: thread_id, msgsCount: finalMessages.length }, "[stream] cached final messages");

          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (e) {
      logger.error({ err: e, threadId: thread_id }, "[stream] proxy error");
      return new Response("Proxy error", { status: 500 });
    }
  }

  logger.info({ path }, "[POST fallback]");
  return Response.json({}, { status: 200 });
}
