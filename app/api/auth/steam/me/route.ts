import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { decryptSteamId } from "../../../../lib/steam-session";
export async function GET() {
  const secret = (env as { STEAM_SESSION_SECRET?: string }).STEAM_SESSION_SECRET;
  const token = (await cookies()).get("steam_session")?.value;
  const steamId = secret && token ? await decryptSteamId(token, secret) : null;
  return Response.json({ steamId });
}
