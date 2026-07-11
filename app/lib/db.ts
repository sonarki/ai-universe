import { neon } from "@neondatabase/serverless";

// Vercel Neon 통합이 주입하는 환경변수 (DATABASE_URL 또는 POSTGRES_URL)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export function getSql() {
  if (!connectionString) return null;
  return neon(connectionString);
}

export type Sql = NonNullable<ReturnType<typeof getSql>>;

let schemaReady: Promise<void> | null = null;

// 첫 요청 시 테이블을 보장 (소규모 서비스용 간이 마이그레이션)
export function ensureSchema(sql: Sql) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL
      )`;
      await sql`CREATE TABLE IF NOT EXISTS progress (
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        step_key TEXT NOT NULL,
        completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, step_key)
      )`;
    })();
  }
  return schemaReady;
}
