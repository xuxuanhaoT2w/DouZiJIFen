const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function sessionKey(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptSteamId(steamId: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await sessionKey(secret), encoder.encode(steamId)));
  const payload = new Uint8Array(iv.length + encrypted.length);
  payload.set(iv); payload.set(encrypted, iv.length);
  return toBase64Url(payload);
}

export async function decryptSteamId(token: string, secret: string) {
  try {
    const payload = fromBase64Url(token);
    if (payload.length < 13) return null;
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: payload.slice(0, 12) }, await sessionKey(secret), payload.slice(12));
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}
