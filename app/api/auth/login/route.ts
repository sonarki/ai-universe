import { getSql, ensureSchema } from "../../../lib/db";
import { createSession, sessionCookie, verifyPassword } from "../../../lib/auth";

const requestLog = new Map<string, number[]>();

// 로그인 시도 제한: IP당 5분에 10회
function isRateLimited(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter((time) => now - time < 5 * 60 * 1000);
  if (recent.length >= 10) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  const sql = getSql();
  if (!sql) return Response.json({ error: "Account storage is not configured yet." }, { status: 503 });
  if (isRateLimited(request)) return Response.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });

  let body: { email?: string; password?: string };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) return Response.json({ error: "bad_credentials" }, { status: 400 });

  await ensureSchema(sql);
  const rows = await sql`SELECT id, email, name, password_hash FROM users WHERE email = ${email} LIMIT 1` as Array<{ id: number; email: string; name: string; password_hash: string }>;
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    return Response.json({ error: "bad_credentials" }, { status: 401 });
  }
  const session = await createSession(user.id);
  return Response.json(
    { user: { email: user.email, name: user.name } },
    { headers: { "Set-Cookie": sessionCookie(session.token, session.expires) } }
  );
}
