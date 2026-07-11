import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getSql, ensureSchema } from "./db";

const SESSION_COOKIE = "aiu_session";
const SESSION_DAYS = 30;

// 비밀번호 해시: scrypt (외부 의존성 없이 Node 내장 crypto 사용)
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number) {
  const sql = getSql();
  if (!sql) throw new Error("no db");
  await ensureSchema(sql);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (${hashToken(token)}, ${userId}, ${expires.toISOString()})`;
  return { token, expires };
}

export function sessionCookie(token: string, expires: Date) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expires.toUTCString()}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readSessionToken(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([a-f0-9]{64})`));
  return match ? match[1] : null;
}

export async function getSessionUser(request: Request) {
  const sql = getSql();
  if (!sql) return null;
  const token = readSessionToken(request);
  if (!token) return null;
  await ensureSchema(sql);
  const rows = await sql`
    SELECT u.id, u.email, u.name FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
    LIMIT 1` as Array<{ id: number; email: string; name: string }>;
  return rows[0] ?? null;
}

export async function deleteSession(request: Request) {
  const sql = getSql();
  const token = readSessionToken(request);
  if (!sql || !token) return;
  await ensureSchema(sql);
  await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
}
