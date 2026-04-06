/**
 * Server-side proxy for VegaRAG agent config.
 * Runs inside the chat UI Next.js server — uses VEGARAG_BACKEND_URL (never exposed to client).
 *
 * GET /chat/api/vegarag-config?bot_id=xxx
 * → proxies to VEGARAG_BACKEND_URL/api/agents/{bot_id}/config
 *
 * Works identically in local dev AND production because it's server-side.
 */

const VEGARAG_URL =
  process.env.VEGARAG_BACKEND_URL || "http://localhost:8000";

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const bot_id = searchParams.get("bot_id");

  if (!bot_id) {
    return Response.json({});
  }

  try {
    const r = await fetch(`${VEGARAG_URL}/api/agents/${bot_id}/config`, {
      // short cache — config changes are infrequent
      next: { revalidate: 10 },
    } as any);

    if (!r.ok) return Response.json({});

    const data = await r.json();
    return Response.json(data);
  } catch (e) {
    console.error("[vegarag-config] fetch failed:", e);
    return Response.json({});
  }
}
