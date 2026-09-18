import { cookies } from "next/headers";
export async function GET() { return Response.json({ steamId: (await cookies()).get("steam_id")?.value || null }); }
