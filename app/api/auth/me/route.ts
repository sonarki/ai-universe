import { getSql, ensureSchema } from "../../../lib/db";
import { getSessionUser } from "../../../lib/auth";

export async function GET(request: Request) {
  const sql = getSql();
  if (!sql) return Response.json({ user: null, configured: false });
  const user = await getSessionUser(request);
  if (!user) return Response.json({ user: null, configured: true });
  await ensureSchema(sql);
  const rows = await sql`SELECT step_key FROM progress WHERE user_id = ${user.id}` as Array<{ step_key: string }>;
  return Response.json({
    user: { email: user.email, name: user.name },
    progress: rows.map((row) => row.step_key),
    configured: true,
  });
}
