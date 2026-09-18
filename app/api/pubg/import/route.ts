import { env } from "cloudflare:workers";

type PubgPlayer = { name: string; kills: number; revives: number; teamKills: number; damageDealt: number };

export async function POST(request: Request) {
  const body = await request.json() as { platform?: string; players?: string[]; matchId?: string };
  const platform = (body.platform || "steam").replace(/[^a-z-]/g, "");
  const names = (body.players || []).map((name) => name.trim()).filter(Boolean).slice(0, 4);
  const key = (env as { PUBG_API_KEY?: string }).PUBG_API_KEY;
  if (!key) return Response.json({ error: "PUBG API 尚未配置密钥" }, { status: 503 });
  if (!names.length) return Response.json({ error: "请先填写游戏昵称" }, { status: 400 });
  const headers = { Authorization: "Bearer " + key, Accept: "application/vnd.api+json" };
  const playerUrl = "https://api.pubg.com/shards/" + platform + "/players?filter[playerNames]=" + encodeURIComponent(names.join(","));
  const playerResponse = await fetch(playerUrl, { headers });
  if (!playerResponse.ok) return Response.json({ error: "未找到玩家或平台不匹配" }, { status: playerResponse.status });
  const players = await playerResponse.json() as { data: Array<{ relationships?: { matches?: { data?: Array<{ id: string }> } } }> };
  const matchId = body.matchId || players.data[0]?.relationships?.matches?.data?.[0]?.id;
  if (!matchId) return Response.json({ error: "没有可导入的近 14 天已结束对局" }, { status: 404 });
  const matchResponse = await fetch("https://api.pubg.com/shards/" + platform + "/matches/" + encodeURIComponent(matchId), { headers });
  if (!matchResponse.ok) return Response.json({ error: "无法读取对局详情" }, { status: matchResponse.status });
  const match = await matchResponse.json() as { data?: { attributes?: { createdAt?: string } }; included?: Array<{ type: string; attributes?: { stats?: PubgPlayer } }> };
  const result = (match.included || []).filter(x => x.type === "participant").map(x => x.attributes?.stats).filter((x): x is PubgPlayer => !!x).filter(x => names.some(n => n.toLowerCase() === x.name.toLowerCase())).map(x => ({ name: x.name, kills: x.kills || 0, rescues: x.revives || 0, teamKills: x.teamKills || 0, damage: x.damageDealt || 0 }));
  return Response.json({ matchId, createdAt: match.data?.attributes?.createdAt, players: result });
}
