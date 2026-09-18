import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { encryptSteamId } from "../../../../lib/steam-session";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const url = new URL(request.url); const state = url.searchParams.get("state");
  if (!state || state !== (await cookies()).get("steam_openid_state")?.value) return new Response(null, { status: 302, headers: { Location: origin + "/?steam=failed" } });
  const params = new URLSearchParams(url.searchParams); params.delete("state"); params.set("openid.mode", "check_authentication");
  const check = await fetch("https://steamcommunity.com/openid/login", { method: "POST", body: params });
  const claimed = params.get("openid.claimed_id") || "";
  const steamId = claimed.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/)?.[1];
  if (!check.ok || !steamId || !(await check.text()).includes("is_valid:true")) return new Response(null, { status: 302, headers: { Location: origin + "/?steam=failed" } });
  const secret = (env as { STEAM_SESSION_SECRET?: string }).STEAM_SESSION_SECRET;
  if (!secret) return new Response(null, { status: 302, headers: { Location: origin + "/?steam=missing-secret" } });
  const response = new Response(null, { status: 302, headers: { Location: origin + "/?steam=connected" } });
  const encrypted = await encryptSteamId(steamId, secret);
  response.headers.append("Set-Cookie", "steam_session=" + encrypted + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000");
  response.headers.append("Set-Cookie", "steam_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  response.headers.append("Set-Cookie", "steam_openid_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return response;
}
