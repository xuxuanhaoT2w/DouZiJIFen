import { env } from "cloudflare:workers";

type PubgPlayer = { name: string; kills: number; teamKills: number; damageDealt: number; teamId?: number; winPlace?: number };
type MatchItem = { id: string; type: string; attributes?: { stats?: PubgPlayer }; relationships?: { participants?: { data?: Array<{ id: string }> } } };

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
  const matches: Array<{ matchId: string; createdAt?: string; won: boolean; anchorName: string; players: Array<{ name: string; kills: number; teamKills: number; damage: number }> }> = [];
  for (const candidate of selected) {
    const response = await fetch("https://api.pubg.com/shards/" + platform + "/matches/" + encodeURIComponent(candidate), { headers });
    if (!response.ok) continue;
    const match = await response.json() as { data?: { attributes?: { createdAt?: string } }; included?: MatchItem[] };
    const createdAt = match.data?.attributes?.createdAt;
    if (start && (!createdAt || Date.parse(createdAt) < start)) continue;
    const included = match.included || [];
    const rows = included.filter(x => x.type === "participant" && x.attributes?.stats).map(x => ({ id: x.id, stats: x.attributes!.stats! }));
    const all = rows.map(row => row.stats);
    const anchorRow = rows.find(row => names.some(n => n.toLowerCase() === row.stats.name.toLowerCase()));
    if (!anchorRow) continue;
    const anchor = anchorRow.stats;
    const anchorTeam = (anchor as PubgPlayer & { team_id?: number | string }).teamId ?? (anchor as PubgPlayer & { team_id?: number | string }).team_id;
    const sameTeam = anchorTeam != null ? all.filter(x => String(((x as PubgPlayer & { team_id?: number | string }).teamId ?? (x as PubgPlayer & { team_id?: number | string }).team_id)) === String(anchorTeam)) : [];
    const roster = included.find(item => item.type === "roster" && item.relationships?.participants?.data?.some(member => member.id === anchorRow.id));
    const rosterIds = roster?.relationships?.participants?.data?.map(member => member.id) || [];
    const rosterTeam = rosterIds.map(id => rows.find(row => row.id === id)?.stats).filter((x): x is PubgPlayer => !!x);
    const squad = (rosterTeam.length >= 2 ? rosterTeam : sameTeam.length >= 2 ? sameTeam : [anchor]).slice(0, 4);
    matches.push({ matchId: candidate, createdAt, won: anchor.winPlace === 1, anchorName: anchor.name, players: squad.map(x => ({ name: x.name, kills: x.kills || 0, teamKills: x.teamKills || 0, damage: Math.round(x.damageDealt || 0) })) });
  }
  if (!matches.length) return Response.json({ error: "没有可导入的已完成对局，或玩家名称不匹配" }, { status: 404 });
  matches.sort((a, b) => Date.parse(a.createdAt || "") - Date.parse(b.createdAt || ""));
  const latest = matches[matches.length - 1];
  return Response.json({ matchId: latest.matchId, createdAt: latest.createdAt, won: latest.won, players: latest.players, matches });
}
