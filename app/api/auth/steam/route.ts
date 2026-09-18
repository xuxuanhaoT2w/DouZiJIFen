export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const state = crypto.randomUUID();
  const callback = origin + "/api/auth/steam/callback?state=" + encodeURIComponent(state);
  const query = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": callback,
    "openid.realm": origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  const response = Response.redirect("https://steamcommunity.com/openid/login?" + query, 302);
  response.headers.append("Set-Cookie", "steam_openid_state=" + state + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600");
  return response;
}
