import { cookies } from "next/headers";

const origin = "https://pubg-bean-arena.bibo-7249.chatgpt.site";

export async function GET(request: Request) {
  const url = new URL(request.url); const state = url.searchParams.get("state");
  if (!state || state !== (await cookies()).get("steam_openid_state")?.value) return Response.redirect(origin + "/?steam=failed", 302);
  const params = new URLSearchParams(url.searchParams); params.delete("state"); params.set("openid.mode", "check_authentication");
  const check = await fetch("https://steamcommunity.com/openid/login", { method: "POST", body: params });
  const claimed = params.get("openid.claimed_id") || "";
  const steamId = claimed.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/)?.[1];
  if (!check.ok || !steamId || !(await check.text()).includes("is_valid:true")) return Response.redirect(origin + "/?steam=failed", 302);
  const response = Response.redirect(origin + "/?steam=connected", 302);
  response.headers.append("Set-Cookie", "steam_id=" + steamId + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000");
  response.headers.append("Set-Cookie", "steam_openid_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return response;
}
