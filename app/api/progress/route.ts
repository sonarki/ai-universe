import { getSql, ensureSchema } from "../../lib/db";
import { getSessionUser } from "../../lib/auth";

const TOPIC_IDS = ["history", "foundations", "ml", "deep", "gen", "llm", "agents", "current", "future", "ethics"];
const STEP_PATTERN = /^([a-z]+):([0-2])$/;

function isValidStep(step: string) {
  const match = STEP_PATTERN.exec(step);
  return match !== null && TOPIC_IDS.includes(match[1]);
}

export async function GET(request: Request) {
  const sql = getSql();
  if (!sql) return Response.json({ error: "not_configured" }, { status: 503 });
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  await ensureSchema(sql);
  const rows = await sql`SELECT step_key FROM progress WHERE user_id = ${user.id}` as Array<{ step_key: string }>;
  return Response.json({ progress: rows.map((row) => row.step_key) });
}

// 완료 단계 업서트 — 단건({step}) 또는 병합({steps: [...]}) 모두 지원
export async function POST(request: Request) {
  const sql = getSql();
  if (!sql) return Response.json({ error: "not_configured" }, { status: 503 });
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body: { step?: string; steps?: string[] };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }

  const raw = body.steps ?? (body.step ? [body.step] : []);
  const steps = [...new Set(raw)].filter(isValidStep).slice(0, 30);
  if (steps.length === 0) return Response.json({ error: "no_valid_steps" }, { status: 400 });

  await ensureSchema(sql);
  for (const step of steps) {
    await sql`INSERT INTO progress (user_id, step_key) VALUES (${user.id}, ${step}) ON CONFLICT DO NOTHING`;
  }
  const rows = await sql`SELECT step_key FROM progress WHERE user_id = ${user.id}` as Array<{ step_key: string }>;
  return Response.json({ progress: rows.map((row) => row.step_key) });
}
