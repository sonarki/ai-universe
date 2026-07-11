import { getSql, ensureSchema } from "../../../lib/db";
import { createSession, hashPassword, sessionCookie } from "../../../lib/auth";

const requestLog = new Map<string, number[]>();

// 가입 시도 제한: IP당 10분에 10회
function isRateLimited(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter((time) => now - time < 10 * 60 * 1000);
  if (recent.length >= 10) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  const sql = getSql();
  if (!sql) return Response.json({ error: "Account storage is not configured yet." }, { status: 503 });
  if (isRateLimited(request)) return Response.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });

  let body: { email?: string; password?: string; name?: string };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim().slice(0, 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }
  if (password.length < 8 || password.length > 200) {
    return Response.json({ error: "weak_password" }, { status: 400 });
  }
  if (!name) return Response.json({ error: "name_required" }, { status: 400 });

  await ensureSchema(sql);
  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1` as Array<{ id: number }>;
  if (existing.length > 0) return Response.json({ error: "email_taken" }, { status: 409 });

  const rows = await sql`
    INSERT INTO users (email, name, password_hash)
    VALUES (${email}, ${name}, ${hashPassword(password)})
    RETURNING id, email, name` as Array<{ id: number; email: string; name: string }>;
  const user = rows[0];
  const session = await createSession(user.id);
  return Response.json(
    { user: { email: user.email, name: user.name } },
    { status: 201, headers: { "Set-Cookie": sessionCookie(session.token, session.expires) } }
  );
}
