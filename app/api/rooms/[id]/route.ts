import { env } from "cloudflare:workers";

type RoomRecord = { state: string; updated_at: number };
const roomId = (value: string) => value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24);

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const id = roomId((await context.params).id);
  if (!id) return Response.json({ error: "房间号无效" }, { status: 400 });
  const row = await (env as { DB: D1Database }).DB.prepare("SELECT state, updated_at FROM rooms WHERE id = ?").bind(id).first<RoomRecord>();
  return Response.json(row ? { id, state: JSON.parse(row.state), updatedAt: row.updated_at } : { id, state: null });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const id = roomId((await context.params).id); const body = await request.json() as { state?: unknown };
  if (!id || !body.state || JSON.stringify(body.state).length > 100000) return Response.json({ error: "保存内容无效" }, { status: 400 });
  const now = Date.now();
  await (env as { DB: D1Database }).DB.prepare("INSERT INTO rooms (id, state, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at").bind(id, JSON.stringify(body.state), now).run();
  return Response.json({ id, updatedAt: now });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const id = roomId((await context.params).id);
  await (env as { DB: D1Database }).DB.prepare("DELETE FROM rooms WHERE id = ?").bind(id).run(); return Response.json({ ok: true });
}
