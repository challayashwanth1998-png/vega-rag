/**
 * VegaRAG Auth API proxy — runs server-side so VEGARAG_BACKEND_URL stays secret.
 *
 * POST /api/vegarag-auth  { action:"login",  bot_id, email, password }
 * POST /api/vegarag-auth  { action:"logout", bot_id }
 * GET  /api/vegarag-auth?bot_id=xxx           → returns users array (to check if auth required)
 */

const VEGARAG_URL =
  process.env.VEGARAG_BACKEND_URL || "http://localhost:8000";

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const bot_id = searchParams.get("bot_id");
  if (!bot_id) return Response.json([]);

  try {
    const r = await fetch(`${VEGARAG_URL}/api/agents/${bot_id}/users`);
    const users = r.ok ? await r.json() : [];
    // Return only email + createdAt, never password hashes
    return Response.json(
      (users as any[]).map((u: any) => ({ email: u.email, createdAt: u.createdAt }))
    );
  } catch {
    return Response.json([]);
  }
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json();
  const { action, bot_id, email, password } = body;

  if (action === "logout") {
    const r = await fetch(`${VEGARAG_URL}/api/agents/${bot_id}/logout`, {
      method: "POST",
    });
    const data = await r.json().catch(() => ({}));
    return Response.json(data, { status: r.ok ? 200 : r.status });
  }

  // Default: login
  const r = await fetch(`${VEGARAG_URL}/api/agents/${bot_id}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await r.json().catch(() => ({}));

  const res = Response.json(
    { ...data, ok: r.ok },
    { status: r.ok ? 200 : r.status }
  );

  // Forward the HttpOnly vegatoken cookie from backend → browser
  const setCookie = r.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);

  return res;
}
