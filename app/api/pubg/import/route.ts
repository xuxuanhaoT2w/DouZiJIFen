import { env } from "cloudflare:workers";

type PubgPlayer = { name: string; kills: number; teamKills: number; damageDealt: number; teamId?: number; winPlace?: number };

export async function POST(request: Request) {
  const body = await request.json() as { platform?: string; players?: string[]; matchId?: string; startAt?: string };
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
  const matchIds = players.data.flatMap(player => player.relationships?.matches?.data?.map(match => match.id) || []).filter((value, index, all) => all.indexOf(value) === index).slice(0, 32);
  const selected = body.matchId ? [body.matchId] : matchIds;
  const start = body.startAt ? Date.parse(body.startAt) : 0;
  const matches: Array<{ matchId: string; createdAt?: string; won: boolean; players: Array<{ name: string; kills: number; teamKills: number; damage: number }> }> = [];
  for (const candidate of selected) {
    const response = await fetch("https://api.pubg.com/shards/" + platform + "/matches/" + encodeURIComponent(candidate), { headers });
    if (!response.ok) continue;
    const match = await response.json() as { data?: { attributes?: { createdAt?: string } }; included?: Array<{ type: string; attributes?: { stats?: PubgPlayer } }> };
    const createdAt = match.data?.attributes?.createdAt;
    if (start && (!createdAt || Date.parse(createdAt) < start)) continue;
    const all = (match.included || []).filter(x => x.type === "participant").map(x => x.attributes?.stats).filter((x): x is PubgPlayer => !!x);
    const anchor = all.find(x => names.some(n => n.toLowerCase() === x.name.toLowerCase()));
    if (!anchor) continue;
    const squad = anchor.teamId === undefined ? all.filter(x => names.some(n => n.toLowerCase() === x.name.toLowerCase())) : all.filter(x => x.teamId === anchor.teamId).slice(0, 4);
    matches.push({ matchId: candidate, createdAt, won: anchor.winPlace === 1, players: squad.map(x => ({ name: x.name, kills: x.kills || 0, teamKills: x.teamKills || 0, damage: x.damageDealt || 0 })) });
  }
  if (!matches.length) return Response.json({ error: "没有可导入的已完成对局，或玩家名称不匹配" }, { status: 404 });
  const latest = matches[0];
  return Response.json({ matchId: latest.matchId, createdAt: latest.createdAt, won: latest.won, players: latest.players, matches });
}
