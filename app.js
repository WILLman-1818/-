const matches = window.LIUYAO_MATCHES || [];
const teams = window.TEAM_PROFILES || {};
let bracketTree = window.WORLD_CUP_BRACKET || { rounds: [] };
let standingsTable = window.WORLD_CUP_STANDINGS || { groups: [] };

const guaNames = ["乾为天", "坤为地", "水雷屯", "山水蒙", "水火既济", "雷火丰", "风雷益", "泽火革", "山泽损", "火地晋"];
const lineLabels = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
const sixRelatives = ["子孙", "官鬼", "妻财", "父母", "兄弟", "子孙"];
const fiveElements = ["木", "火", "土", "金", "水"];
const scoreGates = [
  { name: "守中求破", tone: "父母、官鬼成势，比赛先看防守秩序，进球多来自一次破局。", pace: -0.18, draw: 0.18 },
  { name: "子孙发动", tone: "子孙爻得气，临门一脚和二次进攻被打开，进球窗口会更明显。", pace: 0.24, draw: -0.06 },
  { name: "财旺生攻", tone: "财爻带动控球和推进，强队更容易把场面优势转成比分。", pace: 0.12, draw: -0.1 },
  { name: "官鬼压身", tone: "官鬼临要位，犯错、压迫和心理负担会放大，弱势方更容易丢关键球。", pace: -0.04, draw: -0.16 },
  { name: "兄弟争持", tone: "兄弟爻旺，身体对抗和节奏争夺加重，比分容易胶着。", pace: -0.12, draw: 0.22 },
  { name: "动爻翻局", tone: "动爻牵动世应，比赛中段存在明显转折，比分不宜只看静态强弱。", pace: 0.18, draw: -0.14 }
];
const historicalScorePriors = {
  "1-0": 0.026,
  "2-1": 0.03,
  "2-0": 0.022,
  "1-1": 0.024,
  "3-1": 0.018,
  "0-1": 0.02,
  "1-2": 0.022,
  "2-2": 0.016,
  "3-2": 0.012,
  "0-0": 0.01
};
const gateAnchors = {
  "守中求破": ["1-0", "0-1", "2-0", "0-2", "2-1"],
  "子孙发动": ["2-1", "1-2", "3-1", "2-2", "3-2"],
  "财旺生攻": ["2-0", "3-1", "2-1", "3-0", "1-2"],
  "官鬼压身": ["2-0", "0-2", "2-1", "1-2", "3-1"],
  "兄弟争持": ["1-1", "2-1", "1-2", "2-2", "1-0"],
  "动爻翻局": ["2-2", "3-2", "2-3", "2-1", "1-2"]
};
const forecastModes = {
  balanced: { name: "综合断法", data: 0.58, gua: 0.28, history: 0.14, risk: 0.9 },
  liuyao: { name: "偏六爻断法", data: 0.36, gua: 0.5, history: 0.14, risk: 1.04 },
  data: { name: "偏数据断法", data: 0.76, gua: 0.1, history: 0.14, risk: 0.82 }
};
const teamStrengthBaselines = {
  阿根廷: 91,
  巴西: 90,
  法国: 91,
  英格兰: 90,
  西班牙: 88,
  葡萄牙: 88,
  德国: 87,
  荷兰: 86,
  比利时: 84,
  克罗地亚: 83,
  乌拉圭: 84,
  哥伦比亚: 82,
  意大利: 84,
  瑞士: 78,
  丹麦: 78,
  摩洛哥: 78,
  美国: 76,
  墨西哥: 76,
  加拿大: 74,
  日本: 78,
  韩国: 75,
  加纳: 70,
  刚果民主共和国: 69,
  巴拿马: 62,
  乌兹别克斯坦: 66,
  哥斯达黎加: 67,
  澳大利亚: 72,
  塞内加尔: 78,
  伊朗: 73,
  沙特阿拉伯: 68,
  卡塔尔: 66,
  突尼斯: 70,
  厄瓜多尔: 75,
  土耳其: 76,
  塞尔维亚: 76,
  波兰: 76,
  奥地利: 77,
  苏格兰: 72,
  挪威: 76,
  阿尔及利亚: 73,
  海地: 60,
  伊拉克: 66,
  约旦: 64,
  巴拉圭: 73,
  南非: 69
};
const scenarioProfiles = {
  group: {
    name: "小组赛常规压力",
    tone: "双方还保留调整空间，先看基本盘强弱和卦象主线。",
    pace: 0.06,
    draw: 0.04,
    highGoal: 0.02,
    winNeed: 0.02,
    underdogPoint: 0.02
  },
  drawChase: {
    name: "上轮踢平，需要抢胜",
    tone: "上一场只拿 1 分，平局价值下降，进攻端会更早压上寻找三分。",
    pace: 0.2,
    draw: -0.14,
    highGoal: 0.16,
    winNeed: 0.18,
    underdogPoint: -0.02
  },
  lossNeedPoint: {
    name: "上轮输球，急需拿分",
    tone: "上一场失利后不能再空手，先求不败，再利用转换或定位球偷分。",
    pace: 0.12,
    draw: 0.12,
    highGoal: 0.08,
    winNeed: 0.06,
    underdogPoint: 0.14
  },
  mustwin: {
    name: "必须抢分",
    tone: "积分压力已经压到临界点，平局不够用，比赛会更主动冒险。",
    pace: 0.28,
    draw: -0.18,
    highGoal: 0.2,
    winNeed: 0.22,
    underdogPoint: 0
  },
  goalDifference: {
    name: "需要净胜球",
    tone: "不只要赢，还要争净胜球，领先后仍可能继续加压。",
    pace: 0.34,
    draw: -0.26,
    highGoal: 0.26,
    winNeed: 0.24,
    underdogPoint: -0.08
  },
  cautious: {
    name: "双方谨慎，先保不败",
    tone: "双方都不想先犯错，防守秩序和中场消耗会压低比分上限。",
    pace: -0.2,
    draw: 0.2,
    highGoal: -0.14,
    winNeed: -0.08,
    underdogPoint: 0.08
  }
};

const storedMatchId = window.localStorage?.getItem("liuyao-selected-match");
const storedCastTime = window.localStorage?.getItem("liuyao-cast-time");
const storedDataWeight = window.localStorage?.getItem("liuyao-data-weight");
const storedContext = window.localStorage?.getItem("liuyao-context");

let state = {
  match: matches.find((match) => match.id === storedMatchId) || matches[0],
  castTime: storedCastTime || "2026-06-18T01:00",
  dataWeight: storedDataWeight || "balanced",
  context: storedContext || "group"
};

const teamNameMap = {
  "Argentina": "阿根廷",
  "Australia": "澳大利亚",
  "Austria": "奥地利",
  "Belgium": "比利时",
  "Bolivia": "玻利维亚",
  "Bosnia & Herzegovina": "波黑",
  "Bosnia and Herzegovina": "波黑",
  "Brazil": "巴西",
  "Cabo Verde": "佛得角",
  "Cameroon": "喀麦隆",
  "Canada": "加拿大",
  "Cape Verde": "佛得角",
  "Chile": "智利",
  "Colombia": "哥伦比亚",
  "Congo DR": "刚果民主共和国",
  "Costa Rica": "哥斯达黎加",
  "Croatia": "克罗地亚",
  "Curaçao": "库拉索",
  "Curacao": "库拉索",
  "Czech Republic": "捷克",
  "Czechia": "捷克",
  "Denmark": "丹麦",
  "DR Congo": "刚果民主共和国",
  "Ecuador": "厄瓜多尔",
  "Egypt": "埃及",
  "England": "英格兰",
  "France": "法国",
  "Germany": "德国",
  "Ghana": "加纳",
  "Haiti": "海地",
  "Honduras": "洪都拉斯",
  "Iran": "伊朗",
  "IR Iran": "伊朗",
  "Iraq": "伊拉克",
  "Italy": "意大利",
  "Ivory Coast": "科特迪瓦",
  "Jamaica": "牙买加",
  "Japan": "日本",
  "Jordan": "约旦",
  "Korea Republic": "韩国",
  "Mexico": "墨西哥",
  "Morocco": "摩洛哥",
  "Netherlands": "荷兰",
  "New Zealand": "新西兰",
  "Nigeria": "尼日利亚",
  "Norway": "挪威",
  "Algeria": "阿尔及利亚",
  "Panama": "巴拿马",
  "Paraguay": "巴拉圭",
  "Peru": "秘鲁",
  "Poland": "波兰",
  "Portugal": "葡萄牙",
  "Qatar": "卡塔尔",
  "Saudi Arabia": "沙特阿拉伯",
  "Scotland": "苏格兰",
  "Senegal": "塞内加尔",
  "Serbia": "塞尔维亚",
  "South Africa": "南非",
  "South Korea": "韩国",
  "Spain": "西班牙",
  "Sweden": "瑞典",
  "Switzerland": "瑞士",
  "Tunisia": "突尼斯",
  "Turkey": "土耳其",
  "Türkiye": "土耳其",
  "Uruguay": "乌拉圭",
  "USA": "美国",
  "United States": "美国",
  "Uzbekistan": "乌兹别克斯坦",
  "Venezuela": "委内瑞拉"
};

const venueNameMap = {
  "AT&T Stadium": "AT&T 体育场",
  "BC Place": "BC Place 体育场",
  "BMO Field": "BMO 球场",
  "Dallas Stadium": "达拉斯体育场",
  "Estadio Akron": "阿克伦体育场",
  "Estadio Azteca": "阿兹特克体育场",
  "Gillette Stadium": "吉列体育场",
  "Hard Rock Stadium": "硬石体育场",
  "Houston Stadium": "休斯敦体育场",
  "Levi's Stadium": "李维斯体育场",
  "Lincoln Financial Field": "林肯金融球场",
  "Lumen Field": "流明球场",
  "Mercedes-Benz Stadium": "梅赛德斯-奔驰体育场",
  "MetLife Stadium": "大都会人寿体育场",
  "Mexico City Stadium": "墨西哥城体育场",
  "SoFi Stadium": "SoFi 体育场",
  "Toronto Stadium": "多伦多体育场"
};

async function loadLiveData() {
  try {
    const response = await fetch("/.netlify/functions/live-data", { cache: "no-store" });
    if (!response.ok) throw new Error("live endpoint unavailable");
    const payload = await response.json();
    mergeLiveMatches(payload.matches || []);
    mergeLiveTeams(payload.teams || {});
    if (payload.standings?.groups?.length) standingsTable = payload.standings;
    if (payload.bracket) bracketTree = payload.bracket;
    syncActiveMatchToNearest();
    updateLiveStatus(payload.source || "实时接口", payload.updatedAt || new Date().toISOString());
  } catch {
    updateLiveStatus("本地样例数据", "等待接口接入");
  }
}

function updateLiveStatus(source, updatedAt) {
  const sourceNode = document.querySelector("#live-source");
  const syncNode = document.querySelector("#last-sync");
  if (sourceNode) sourceNode.textContent = source;
  if (syncNode) syncNode.textContent = updatedAt === "等待接口接入" ? updatedAt : new Date(updatedAt).toLocaleString("zh-CN");
}

function persistState() {
  if (!state.match) return;
  window.localStorage?.setItem("liuyao-selected-match", state.match.id);
  window.localStorage?.setItem("liuyao-cast-time", state.castTime);
  window.localStorage?.setItem("liuyao-data-weight", state.dataWeight);
  window.localStorage?.setItem("liuyao-context", state.context);
}

function mergeLiveMatches(liveMatches) {
  liveMatches.forEach((liveMatch) => {
    const localMatch = matches.find((match) => match.id === liveMatch.id) || matches.find((match) => matchIdentityKey(match) === matchIdentityKey(liveMatch));
    if (!localMatch) {
      matches.push(liveMatch);
      return;
    }
    mergeMatchRecord(localMatch, liveMatch);
  });
  compactDuplicateMatches();
}

function mergeLiveTeams(liveTeams) {
  Object.entries(liveTeams).forEach(([teamName, profile]) => {
    teams[teamName] = { ...(teams[teamName] || {}), ...profile };
  });
}

function displayTeam(teamName) {
  return teamNameMap[teamName] || teamName || "待定";
}

function displayVenue(venue) {
  if (!venue) return "场地待定";
  return venueNameMap[venue] || venue.replace(/\bStadium\b/g, "体育场").replace(/\bField\b/g, "球场");
}

function displayStage(stage) {
  if (!stage) return "世界杯赛程";
  const groupRound = stage.match(/Group Stage\s*-\s*(\d+)/i);
  if (groupRound) return `世界杯小组赛 · 第 ${groupRound[1]} 轮`;
  return stage
    .replace(/FIFA World Cup/gi, "世界杯")
    .replace(/World Cup/gi, "世界杯")
    .replace(/Group Stage/gi, "小组赛")
    .replace(/Round of 32/gi, "32 强")
    .replace(/Round of 16/gi, "16 强")
    .replace(/Quarter[-\s]?finals?/gi, "8 强")
    .replace(/Semi[-\s]?finals?/gi, "半决赛")
    .replace(/Final/gi, "决赛")
    .replace(/\s+-\s+(\d+)/g, " · 第 $1 轮");
}

function fixtureTitle(match) {
  return `${displayTeam(match.home)} vs ${displayTeam(match.away)}`;
}

function displayPlayerName(player, teamName) {
  return String(player.name || "").replace(teamName, displayTeam(teamName));
}

function canonicalTeamName(teamName) {
  return displayTeam(teamName)
    .toLowerCase()
    .replace(/\s|·|\.|'|’|-|&|和|共和国|体育|足球|国家队/g, "");
}

function isFinishedMatch(match) {
  const status = String(match.status || match.statusShort || "").toLowerCase();
  return Boolean(match.locked) || ["archived", "finished", "ft", "aet", "pen"].includes(status);
}

function isLiveMatch(match) {
  const status = String(match.status || match.statusShort || "").toLowerCase();
  return ["live", "1h", "2h", "ht", "et", "p"].includes(status);
}

function parseMatchTimestamp(match) {
  const value = String(match.timeCN || "").trim();
  const cnMatch = value.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})\D+(\d{1,2}):(\d{2})/);
  if (cnMatch) {
    const [, year, month, day, hour, minute] = cnMatch.map(Number);
    return new Date(year, month - 1, day, hour, minute).getTime();
  }
  const dateMatch = String(match.date || "").match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch.map(Number);
    return new Date(year, month - 1, day, 23, 59).getTime();
  }
  return Number.MAX_SAFE_INTEGER;
}

function matchIdentityKey(match) {
  const teamPair = [canonicalTeamName(match.home), canonicalTeamName(match.away)].sort().join("vs");
  const time = parseMatchTimestamp(match);
  const timeKey = time === Number.MAX_SAFE_INTEGER ? String(match.timeCN || match.date || "") : new Date(time).toISOString().slice(0, 16);
  return `${teamPair}|${timeKey}`;
}

function hasFinalScore(match) {
  return typeof match.homeScore === "number" && typeof match.awayScore === "number";
}

function mergeMatchRecord(target, source) {
  const targetFinished = isFinishedMatch(target);
  const sourceFinished = isFinishedMatch(source);
  const shouldKeepLocalNames = target.home !== "待定" && target.away !== "待定";
  const next = {
    ...source,
    id: target.id,
    home: shouldKeepLocalNames ? target.home : source.home,
    away: shouldKeepLocalNames ? target.away : source.away,
    status: sourceFinished || targetFinished ? "finished" : source.status || target.status,
    locked: sourceFinished || targetFinished,
    context: source.context || target.context,
    sourceNote: source.sourceNote || target.sourceNote
  };
  if (!hasFinalScore(source) && hasFinalScore(target)) {
    next.homeScore = target.homeScore;
    next.awayScore = target.awayScore;
  }
  Object.assign(target, next);
}

function compactDuplicateMatches() {
  const byIdentity = new Map();
  const unique = [];
  matches.forEach((match) => {
    const key = matchIdentityKey(match);
    const existing = byIdentity.get(key);
    if (!existing) {
      byIdentity.set(key, match);
      unique.push(match);
      return;
    }
    const preferredSource = hasFinalScore(match) && !hasFinalScore(existing) ? match : existing;
    const secondarySource = preferredSource === match ? existing : match;
    mergeMatchRecord(preferredSource, secondarySource);
    byIdentity.set(key, preferredSource);
    const index = unique.indexOf(existing);
    if (index >= 0 && preferredSource !== existing) unique[index] = preferredSource;
  });
  matches.splice(0, matches.length, ...unique);
  state.match = matches.find((match) => match.id === state.match?.id) || matches.find((match) => matchIdentityKey(match) === matchIdentityKey(state.match || {})) || state.match;
}

function getSortedMatches() {
  const now = Date.now();
  return [...matches].sort((a, b) => {
    const aTime = parseMatchTimestamp(a);
    const bTime = parseMatchTimestamp(b);
    const aFinished = isFinishedMatch(a) || aTime < now - 2 * 60 * 60 * 1000;
    const bFinished = isFinishedMatch(b) || bTime < now - 2 * 60 * 60 * 1000;
    const aGroup = isLiveMatch(a) ? 0 : aFinished ? 2 : 1;
    const bGroup = isLiveMatch(b) ? 0 : bFinished ? 2 : 1;
    if (aGroup !== bGroup) return aGroup - bGroup;
    if (aGroup === 2) return bTime - aTime;
    return aTime - bTime;
  });
}

function syncActiveMatchToNearest() {
  const sorted = getSortedMatches();
  if (!sorted.length) return;
  if (!state.match || isFinishedMatch(state.match)) state.match = sorted[0];
}

function statusLabel(match) {
  if (isFinishedMatch(match)) {
    const hasScore = typeof match.homeScore === "number" && typeof match.awayScore === "number";
    return hasScore ? `完赛 · ${match.homeScore}-${match.awayScore}` : "完赛";
  }
  if (isLiveMatch(match)) return "进行中，实时更新";
  return match.context || "未开赛，赛前数据持续更新";
}

function selectMatch(match, nextPage) {
  state.match = match;
  persistState();
  if (nextPage) {
    window.location.href = nextPage;
    return;
  }
  renderAll();
}

function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function weightedAverage(items, key) {
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + item[key], 0) / items.length;
}

function resolveTeamProfile(teamName) {
  const displayName = displayTeam(teamName);
  const profile = teams[teamName] || teams[displayName];
  if (profile?.players?.length) return profile;
  const baseline = teamStrengthBaseline(teamName);
  return {
    teamForm: baseline,
    attack: baseline,
    defense: clamp(baseline - 2, 52, 92),
    goalkeeper: clamp(baseline - 3, 50, 90),
    setPiece: clamp(baseline - 4, 50, 88),
    tournamentExperience: clamp(baseline - 5, 48, 90),
    recentExperience: "暂无深度球员数据，先按国家队基本实力和实时赛果保守校准。",
    players: [
      { name: `${displayName} 进攻核心`, role: "前场", influence: baseline, attack: baseline, creation: baseline - 3, defense: 44, form: baseline },
      { name: `${displayName} 中场核心`, role: "中场", influence: baseline - 2, attack: baseline - 8, creation: baseline - 1, defense: baseline - 8, form: baseline - 1 },
      { name: `${displayName} 防守核心`, role: "后卫", influence: baseline - 4, attack: 42, creation: 48, defense: baseline - 1, form: baseline - 2 }
    ]
  };
}

function teamStrengthBaseline(teamName) {
  const displayName = displayTeam(teamName);
  return teamStrengthBaselines[teamName] || teamStrengthBaselines[displayName] || 68;
}

function teamStandingRow(teamName) {
  const canonical = canonicalTeamName(teamName);
  for (const group of standingsTable.groups || []) {
    const row = (group.rows || []).find((item) => canonicalTeamName(item.team) === canonical);
    if (row) return row;
  }
  return null;
}

function teamRecentStats(teamName) {
  const canonical = canonicalTeamName(teamName);
  const finished = matches.filter((match) => hasFinalScore(match) && [match.home, match.away].some((name) => canonicalTeamName(name) === canonical));
  const row = teamStandingRow(teamName);
  const fromMatches = finished.reduce(
    (stats, match) => {
      const isHome = canonicalTeamName(match.home) === canonical;
      const goalsFor = isHome ? match.homeScore : match.awayScore;
      const goalsAgainst = isHome ? match.awayScore : match.homeScore;
      stats.played += 1;
      stats.goalsFor += goalsFor;
      stats.goalsAgainst += goalsAgainst;
      stats.points += goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0;
      return stats;
    },
    { played: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }
  );
  const played = fromMatches.played || row?.played || 0;
  const goalsFor = fromMatches.played ? fromMatches.goalsFor : row?.goalsFor || 0;
  const goalsAgainst = fromMatches.played ? fromMatches.goalsAgainst : row?.goalsAgainst || 0;
  const points = fromMatches.played ? fromMatches.points : row?.points || 0;
  return {
    played,
    goalsFor,
    goalsAgainst,
    points,
    goalsForPerGame: played ? goalsFor / played : 0,
    goalsAgainstPerGame: played ? goalsAgainst / played : 0,
    pointsPerGame: played ? points / played : 0,
    goalDiffPerGame: played ? (goalsFor - goalsAgainst) / played : 0
  };
}

function teamPower(teamName) {
  const team = resolveTeamProfile(teamName);
  const players = team.players;
  const baseline = teamStrengthBaseline(teamName);
  const recent = teamRecentStats(teamName);
  const recentAttack = recent.played ? clamp(64 + recent.goalsForPerGame * 10 + recent.pointsPerGame * 2, 52, 92) : baseline;
  const recentDefense = recent.played ? clamp(82 - recent.goalsAgainstPerGame * 9 + recent.goalDiffPerGame * 3, 50, 92) : baseline;
  const playerAttack = weightedAverage(players, "attack");
  const playerCreation = weightedAverage(players, "creation");
  const playerDefense = weightedAverage(players, "defense");
  const playerForm = weightedAverage(players, "form");
  const attackCore = playerAttack * 0.24 + playerCreation * 0.18 + team.attack * 0.22 + team.teamForm * 0.14 + baseline * 0.12 + recentAttack * 0.1;
  const defenseCore = playerDefense * 0.18 + team.defense * 0.24 + team.goalkeeper * 0.22 + team.teamForm * 0.12 + baseline * 0.12 + recentDefense * 0.12;
  const experienceCore = team.tournamentExperience * 0.42 + baseline * 0.28 + team.teamForm * 0.16 + team.setPiece * 0.14;
  const playerCore = playerAttack * 0.28 + playerCreation * 0.2 + playerForm * 0.22 + weightedAverage(players, "influence") * 0.3;
  const strength = attackCore * 0.32 + defenseCore * 0.26 + experienceCore * 0.2 + playerCore * 0.14 + baseline * 0.08;
  return {
    attack: Math.round(attackCore),
    defense: Math.round(defenseCore),
    experience: Math.round(experienceCore),
    setPiece: team.setPiece,
    form: team.teamForm,
    baseline,
    strength: Math.round(strength),
    recent,
    players
  };
}

function castHexagram(match, castTime) {
  const seed = hashText(`${match.id}|${castTime}|${match.home}|${match.away}`);
  const lines = Array.from({ length: 6 }, (_, index) => {
    const value = (seed >> ((index * 5) % 24)) & 31;
    const relative = sixRelatives[(seed + index * 7) % sixRelatives.length];
    const element = fiveElements[(seed + index * 3) % fiveElements.length];
    const yin = value % 2 === 0;
    const moving = [0, 3, 6, 9, 12, 18, 24].includes(value);
    return {
      yin,
      moving,
      label: lineLabels[index],
      role: index === 2 ? "世" : index === 5 ? "应" : "",
      relative,
      element,
      strength: clamp(46 + (value % 13) * 4 + (moving ? 15 : 0) + (yin ? -3 : 5), 35, 108)
    };
  });
  const movingCount = lines.filter((line) => line.moving).length;
  const shiLine = lines[2];
  const yingLine = lines[5];
  const usefulLine = [...lines].sort((a, b) => {
    const aUseful = a.relative === "子孙" ? 18 : 0;
    const bUseful = b.relative === "子孙" ? 18 : 0;
    return b.strength + bUseful - (a.strength + aUseful);
  })[0];
  const officerLine = [...lines].filter((line) => line.relative === "官鬼").sort((a, b) => b.strength - a.strength)[0];
  const moneyLine = [...lines].filter((line) => line.relative === "妻财").sort((a, b) => b.strength - a.strength)[0];
  const siblingLine = [...lines].filter((line) => line.relative === "兄弟").sort((a, b) => b.strength - a.strength)[0];
  const gate = scoreGates[seed % scoreGates.length];
  const shiYingDelta = shiLine.strength - yingLine.strength;
  const usefulHome = usefulLine.label === shiLine.label || usefulLine.role === "世" || lines.indexOf(usefulLine) < 3;
  const usefulAway = usefulLine.label === yingLine.label || usefulLine.role === "应" || lines.indexOf(usefulLine) >= 3;
  const homeBoost =
    shiYingDelta / 115 +
    (shiLine.moving ? (shiLine.relative === "官鬼" ? -0.18 : 0.12) : 0.04) +
    (usefulHome ? 0.16 : -0.03) +
    (moneyLine && lines.indexOf(moneyLine) < 3 ? 0.08 : 0);
  const awayBoost =
    -shiYingDelta / 115 +
    (yingLine.moving ? (yingLine.relative === "官鬼" ? -0.14 : 0.14) : 0.02) +
    (usefulAway ? 0.16 : -0.03) +
    (moneyLine && lines.indexOf(moneyLine) >= 3 ? 0.08 : 0);
  const defensiveBrake = (officerLine ? officerLine.strength / 520 : 0.06) + (siblingLine ? siblingLine.strength / 760 : 0);
  const paceBoost = gate.pace + movingCount * 0.065 + (usefulLine.relative === "子孙" ? usefulLine.strength / 440 : 0) - defensiveBrake;
  const drawBias = clamp(gate.draw + (Math.abs(shiYingDelta) < 8 ? 0.18 : -0.08) + (siblingLine ? siblingLine.strength / 560 : 0), -0.2, 0.45);
  const direction =
    homeBoost > awayBoost + 0.18
      ? "世爻得气，主队更容易先稳后取势"
      : awayBoost > homeBoost + 0.18
        ? "应爻带动，客队更容易抢到结果"
        : "世应相持，胜负要看中后段变爻";
  return {
    seed,
    lines,
    movingCount,
    baseGua: guaNames[seed % guaNames.length],
    changedGua: guaNames[(seed >>> 5) % guaNames.length],
    usefulGod: `${usefulLine.label}${usefulLine.relative}临${usefulLine.element}${usefulLine.moving ? "发动" : "静守"}，${usefulLine.relative === "子孙" ? "主进球机会被打开" : "主比赛节奏受其牵制"}`,
    shiYing: direction,
    scoreGate: gate.name,
    gateTone: gate.tone,
    shiYingDelta,
    paceBoost,
    drawBias,
    homeBoost,
    awayBoost
  };
}

function poisson(lambda, k) {
  let factorial = 1;
  for (let i = 2; i <= k; i += 1) factorial *= i;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial;
}

function scoreFitByGua(gua, homeGoals, awayGoals, homePower, awayPower) {
  const total = homeGoals + awayGoals;
  const diff = homeGoals - awayGoals;
  const dataEdge = resultDataEdge(homePower, awayPower);
  let fit = 1;
  if (gua.homeBoost > gua.awayBoost + 0.16 && diff > 0) fit += 0.22;
  if (gua.awayBoost > gua.homeBoost + 0.16 && diff < 0) fit += 0.22;
  if (Math.abs(gua.homeBoost - gua.awayBoost) < 0.16 && Math.abs(diff) <= 1) fit += 0.12;
  if (gua.drawBias > 0.2 && diff === 0) fit += gua.drawBias;
  if (gua.paceBoost > 0.18 && total >= 3) fit += 0.18;
  if (gua.paceBoost < -0.12 && total <= 2) fit += 0.16;
  if (gua.movingCount >= 3 && Math.abs(diff) === 1 && total >= 2) fit += 0.12;
  if (dataEdge > 12 && diff > 0) fit += 0.12;
  if (dataEdge < -12 && diff < 0) fit += 0.12;
  if (dataEdge > 16 && diff < 0) fit -= 0.16;
  if (dataEdge < -16 && diff > 0) fit -= 0.16;
  return fit;
}

function omenScoreBias(gua, homeGoals, awayGoals, homePower, awayPower) {
  const total = homeGoals + awayGoals;
  const diff = homeGoals - awayGoals;
  const dataEdge = resultDataEdge(homePower, awayPower);
  const guaEdge = gua.homeBoost - gua.awayBoost;
  let bias = 0;
  if (gua.scoreGate === "守中求破") {
    if (total <= 2 && Math.abs(diff) <= 1) bias += 0.018;
    if (guaEdge >= 0 && homeGoals === 1 && awayGoals === 0) bias += 0.032;
    if (guaEdge < 0 && homeGoals === 0 && awayGoals === 1) bias += 0.032;
    if (Math.abs(dataEdge) > 25 && total === 2 && Math.abs(diff) === 2) bias += 0.018;
  }
  if (gua.scoreGate === "子孙发动") {
    if (total >= 3 && total <= 5) bias += 0.03;
    if (Math.abs(diff) <= 1 && total >= 3) bias += 0.018;
    if (guaEdge >= 0 && homeGoals > awayGoals && total >= 3) bias += 0.018;
    if (guaEdge < 0 && awayGoals > homeGoals && total >= 3) bias += 0.018;
    if ((homeGoals === 2 && awayGoals === 1) || (homeGoals === 1 && awayGoals === 2) || (homeGoals === 2 && awayGoals === 2)) bias += 0.022;
  }
  if (gua.scoreGate === "财旺生攻") {
    if (dataEdge >= 0 && homeGoals >= 2 && homeGoals > awayGoals) bias += 0.034;
    if (dataEdge < 0 && awayGoals >= 2 && awayGoals > homeGoals) bias += 0.034;
    if (total >= 2 && total <= 4) bias += 0.014;
  }
  if (gua.scoreGate === "官鬼压身") {
    if (Math.abs(diff) >= 1 && total <= 3) bias += 0.022;
    if (dataEdge >= 0 && homeGoals >= 2 && awayGoals <= 1) bias += 0.026;
    if (dataEdge < 0 && awayGoals >= 2 && homeGoals <= 1) bias += 0.026;
  }
  if (gua.scoreGate === "兄弟争持") {
    if (Math.abs(diff) <= 1 && total <= 3) bias += 0.026;
    if (homeGoals === 1 && awayGoals === 1) bias += 0.026;
  }
  if (gua.scoreGate === "动爻翻局") {
    if (total >= 3 && Math.abs(diff) <= 1) bias += 0.032;
    if ((homeGoals === 2 && awayGoals === 1) || (homeGoals === 1 && awayGoals === 2) || (homeGoals === 2 && awayGoals === 2)) bias += 0.024;
  }
  return bias;
}

function finishedGoalBaseline() {
  const finished = matches.filter((match) => hasFinalScore(match));
  if (!finished.length) return 0;
  const averageGoals = finished.reduce((sum, match) => sum + match.homeScore + match.awayScore, 0) / finished.length;
  return clamp((averageGoals - 2.45) / 5, -0.16, 0.24);
}

function historicalScoreBias(gua, homeGoals, awayGoals, homePower, awayPower) {
  const key = `${homeGoals}-${awayGoals}`;
  const reverseKey = `${awayGoals}-${homeGoals}`;
  const anchors = gateAnchors[gua.scoreGate] || [];
  const dataEdge = resultDataEdge(homePower, awayPower);
  let bias = historicalScorePriors[key] || (historicalScorePriors[reverseKey] ? historicalScorePriors[reverseKey] * 0.72 : 0);
  if (anchors.includes(key)) bias += 0.034;
  if (anchors.includes(reverseKey)) bias += 0.018;
  if (dataEdge > 24 && homeGoals > awayGoals && homeGoals >= 2) bias += 0.016;
  if (dataEdge < -24 && awayGoals > homeGoals && awayGoals >= 2) bias += 0.016;
  if (gua.paceBoost > 0.16 && homeGoals + awayGoals >= 3) bias += 0.018;
  if (gua.paceBoost < -0.16 && homeGoals + awayGoals >= 4) bias -= 0.012;
  return Math.max(0, bias);
}

function scenarioProfile(context = state.context) {
  return scenarioProfiles[context] || scenarioProfiles.group;
}

function scenarioScoreBias(scenario, homeGoals, awayGoals, homePower, awayPower) {
  const total = homeGoals + awayGoals;
  const diff = homeGoals - awayGoals;
  const dataEdge = resultDataEdge(homePower, awayPower);
  let bias = 0;
  if (diff === 0) bias += scenario.draw * 0.16;
  if (total >= 3) bias += scenario.highGoal * 0.16;
  if (diff !== 0) bias += scenario.winNeed * 0.12;
  if (scenario.name.includes("踢平")) {
    if (total >= 3 && Math.abs(diff) <= 1) bias += 0.024;
    if (diff !== 0 && total >= 2) bias += 0.02;
    if (homeGoals === 0 && awayGoals === 0) bias -= 0.05;
  }
  if (scenario.name.includes("输球")) {
    if (diff === 0 && total >= 2) bias += 0.034;
    if (Math.abs(diff) === 1 && total >= 2) bias += 0.02;
    if (dataEdge > 18 && awayGoals >= 1) bias += 0.012;
    if (dataEdge < -18 && homeGoals >= 1) bias += 0.012;
  }
  if (scenario.name.includes("净胜球")) {
    if (Math.abs(diff) >= 2 && total >= 2) bias += 0.082;
    if (Math.abs(diff) === 1) bias -= 0.028;
    if (dataEdge > 22 && diff >= 2) bias += 0.052;
    if (dataEdge < -22 && diff <= -2) bias += 0.052;
    if ((homeGoals === 3 && awayGoals <= 1) || (awayGoals === 3 && homeGoals <= 1)) bias += 0.028;
    if (diff === 0) bias -= 0.06;
  }
  if (scenario.name.includes("谨慎")) {
    if (total <= 2 && Math.abs(diff) <= 1) bias += 0.03;
    if (total >= 4) bias -= 0.05;
  }
  return bias;
}

function directionFit(gua, homeGoals, awayGoals) {
  const diff = homeGoals - awayGoals;
  const guaEdge = gua.homeBoost - gua.awayBoost;
  if (diff === 0) return Math.abs(guaEdge) < 0.18 ? 0.14 : -0.04;
  if (guaEdge > 0.16 && diff > 0) return 0.18;
  if (guaEdge < -0.16 && diff < 0) return 0.18;
  if (Math.abs(diff) === 1) return 0.04;
  return -0.1;
}

function resultDataEdge(homePower, awayPower) {
  return (
    (homePower.strength - awayPower.strength) * 0.42 +
    (homePower.attack - awayPower.defense) * 0.22 +
    (homePower.form - awayPower.form) * 0.12 +
    (homePower.experience - awayPower.experience) * 0.12 +
    (homePower.recent.pointsPerGame - awayPower.recent.pointsPerGame) * 4 +
    (homePower.recent.goalDiffPerGame - awayPower.recent.goalDiffPerGame) * 5
  );
}

function dataAwareDirectionFit(gua, homeGoals, awayGoals, homePower, awayPower) {
  const diff = homeGoals - awayGoals;
  const guaFit = directionFit(gua, homeGoals, awayGoals);
  const dataEdge = resultDataEdge(homePower, awayPower);
  if (diff === 0) return Math.abs(dataEdge) >= 15 ? guaFit - 0.05 : guaFit + 0.04;
  if (dataEdge >= 12 && diff > 0) return guaFit + 0.14;
  if (dataEdge <= -12 && diff < 0) return guaFit + 0.14;
  if (dataEdge >= 12 && diff < 0) return guaFit - 0.24;
  if (dataEdge <= -12 && diff > 0) return guaFit - 0.24;
  return guaFit;
}

function resultPlausibility(homeGoals, awayGoals, homePower, awayPower) {
  const diff = homeGoals - awayGoals;
  const dataEdge = resultDataEdge(homePower, awayPower);
  const strengthGap = homePower.strength - awayPower.strength;
  const favoriteGap = Math.abs(strengthGap);
  let multiplier = 1;
  if (diff === 0) {
    if (favoriteGap >= 18) multiplier -= 0.14;
    if (favoriteGap <= 8) multiplier += 0.06;
  } else {
    const homeWins = diff > 0;
    const resultAgainstData = (homeWins && dataEdge < -10) || (!homeWins && dataEdge > 10);
    const weakerWins = (homeWins && strengthGap < -10) || (!homeWins && strengthGap > 10);
    if (weakerWins) multiplier -= clamp((favoriteGap - 8) / 42, 0.12, 0.5);
    if (resultAgainstData) multiplier -= clamp((Math.abs(dataEdge) - 8) / 45, 0.1, 0.42);
    if (Math.abs(diff) >= 2 && weakerWins) multiplier -= 0.18;
    if (!resultAgainstData && !weakerWins) multiplier += clamp(favoriteGap / 90, 0.04, 0.16);
  }
  const winnerRecentLift =
    diff > 0
      ? homePower.recent.pointsPerGame - awayPower.recent.pointsPerGame + (homePower.recent.goalsForPerGame - awayPower.recent.goalsForPerGame) * 0.4
      : awayPower.recent.pointsPerGame - homePower.recent.pointsPerGame + (awayPower.recent.goalsForPerGame - homePower.recent.goalsForPerGame) * 0.4;
  if (diff !== 0 && winnerRecentLift > 0.8) multiplier += 0.1;
  if (diff !== 0 && winnerRecentLift < -0.8) multiplier -= 0.1;
  return clamp(multiplier, 0.24, 1.18);
}

function dataScoreFit(homeGoals, awayGoals, homeLambda, awayLambda, homePower, awayPower) {
  const expectedHome = clamp(Math.round(homeLambda), 0, 6);
  const expectedAway = clamp(Math.round(awayLambda), 0, 6);
  const closeness = 1 / (1 + Math.abs(homeGoals - expectedHome) + Math.abs(awayGoals - expectedAway));
  const diff = homeGoals - awayGoals;
  const dataEdge = resultDataEdge(homePower, awayPower);
  let edgeFit = 0;
  if (dataEdge > 12 && diff > 0) edgeFit = 0.18;
  if (dataEdge < -12 && diff < 0) edgeFit = 0.18;
  if (Math.abs(dataEdge) <= 12 && Math.abs(diff) <= 1) edgeFit = 0.12;
  if (dataEdge > 16 && diff < 0) edgeFit -= 0.18;
  if (dataEdge < -16 && diff > 0) edgeFit -= 0.18;
  return closeness * 0.34 + edgeFit;
}

function modeScore(candidate, mode, gua, scenario, homeLambda, awayLambda, homePower, awayPower) {
  const scoreKey = `${candidate.home}-${candidate.away}`;
  const anchorFit = (gateAnchors[gua.scoreGate] || []).includes(scoreKey) ? 0.18 : 0;
  const guaScore = candidate.guaFit * 0.2 + candidate.omenBias * 3 + dataAwareDirectionFit(gua, candidate.home, candidate.away, homePower, awayPower) + anchorFit;
  const dataScore = candidate.base * 3.8 + dataScoreFit(candidate.home, candidate.away, homeLambda, awayLambda, homePower, awayPower);
  const historyScore = candidate.historyBias * 4.2;
  const volatility = candidate.home + candidate.away >= 3 ? (0.04 + Math.max(0, scenario.highGoal) * 0.08) * mode.risk : 0;
  const lowScoreBrake = candidate.home + candidate.away <= 1 && gua.paceBoost > 0.12 ? -0.12 : 0;
  const score = mode.gua * guaScore + mode.data * dataScore + mode.history * historyScore + candidate.scenarioBias * 2.8 + volatility + lowScoreBrake + candidate.salt * 0.015;
  return Math.max(0.0001, score * candidate.plausibility);
}

function recommendationRate(candidate, index, topScore, mode, gua, scenario, homeLambda, awayLambda, homePower, awayPower) {
  const relative = Math.pow(candidate.modeRaw / topScore, 0.72);
  const scoreKey = `${candidate.home}-${candidate.away}`;
  const anchor = (gateAnchors[gua.scoreGate] || []).includes(scoreKey) ? 9 : 0;
  const guaDirection = directionFit(gua, candidate.home, candidate.away);
  const dataDirection = dataAwareDirectionFit(gua, candidate.home, candidate.away, homePower, awayPower);
  const direction = dataDirection > 0.1 ? 8 : 0;
  const dataFit = dataScoreFit(candidate.home, candidate.away, homeLambda, awayLambda, homePower, awayPower) > 0.25 ? 7 : 0;
  const scenarioFit = candidate.scenarioBias > 0.025 ? 8 : candidate.scenarioBias > 0.01 ? 4 : 0;
  const movingCertainty = Math.min(12, gua.movingCount * 3);
  const modeCertainty = mode.name === "偏六爻断法" ? Math.abs(gua.homeBoost - gua.awayBoost) * 16 : mode.name === "偏数据断法" ? Math.abs(homeLambda - awayLambda) * 6 : 6;
  const plausibilityAdjustment = Math.round((candidate.plausibility - 1) * 26);
  const rankPenalty = index * 10;
  const rawRate = Math.round(42 + relative * 34 + anchor + direction + dataFit + scenarioFit + movingCertainty + modeCertainty + plausibilityAdjustment - rankPenalty);
  const cap = guaDirection < 0.05 ? 92 : candidate.plausibility < 0.72 ? 78 : 99;
  return clamp(rawRate, 28, cap);
}

function scoreRationale(candidate, mode, gua, scenario, homeLambda, awayLambda, homePower, awayPower) {
  const scoreKey = `${candidate.home}-${candidate.away}`;
  const total = candidate.home + candidate.away;
  const diff = candidate.home - candidate.away;
  const anchorHit = (gateAnchors[gua.scoreGate] || []).includes(scoreKey);
  const dataEdge = resultDataEdge(homePower, awayPower);
  const dataAligned = (diff > 0 && dataEdge > 8) || (diff < 0 && dataEdge < -8) || (diff === 0 && Math.abs(dataEdge) <= 10);
  const upsetText =
    candidate.plausibility < 0.72
      ? "但该比分与球队实力或近期进球数据相冲，只作低把握度变爻保留"
      : Math.abs(dataEdge) >= 12
        ? "球队实力、球员攻击力和近期赛果与该方向基本同向"
        : "双方基本面接近，比分更看临场细节";
  const directionText =
    diff === 0
      ? "世应相持，平局形态被保留"
      : directionFit(gua, candidate.home, candidate.away) < 0.05 && dataAligned
        ? "卦象锚点不完全顺世应，但球队实力和近期数据支持该方向"
        : dataAwareDirectionFit(gua, candidate.home, candidate.away, homePower, awayPower) > 0.1
        ? "世应方向与比分胜负一致"
        : "作为变爻反向结果保留";
  const goalText = total >= 4 ? "进球盘打开，属于大球候选" : total >= 3 ? "有进球窗口，但仍在可控比分带" : "防守秩序较重，偏小比分";
  const modeText =
    mode.name === "偏六爻断法"
      ? "六爻权重较高，优先看卦门和动爻"
      : mode.name === "偏数据断法"
        ? `数据权重较高，贴近 ${homeLambda.toFixed(1)}-${awayLambda.toFixed(1)} 的进球期望`
        : "综合六爻、数据和历史比分形态";
  const scenarioText = candidate.scenarioBias > 0.02 ? `比赛场景吻合“${scenario.name}”的积分压力` : `比赛场景按“${scenario.name}”修正`;
  return `${anchorHit ? "命中卦门锚点；" : ""}${directionText}；${goalText}；${modeText}；${scenarioText}；${upsetText}。`;
}

function calculateForecast(contextOverride = state.context) {
  const match = state.match;
  const home = teamPower(match.home);
  const away = teamPower(match.away);
  const gua = castHexagram(match, state.castTime);
  const mode = forecastModes[state.dataWeight] || forecastModes.balanced;
  const scenario = scenarioProfile(contextOverride);
  const weights = { liuyao: mode.gua, data: mode.data };
  const contextPace = scenario.pace;
  const recentGoalLift = finishedGoalBaseline();
  const seedNoise = ((hashText(`${match.id}|${state.castTime}|score-qimen`) % 41) - 20) / 160;
  const homeRecentAttack = home.recent.played ? (home.recent.goalsForPerGame - 1.15) * 0.22 : 0;
  const awayRecentAttack = away.recent.played ? (away.recent.goalsForPerGame - 1.15) * 0.22 : 0;
  const homeRecentDefense = home.recent.played ? (1.1 - home.recent.goalsAgainstPerGame) * 0.12 : 0;
  const awayRecentDefense = away.recent.played ? (1.1 - away.recent.goalsAgainstPerGame) * 0.12 : 0;
  const homeDataEdge =
    (home.attack - away.defense) / 26 +
    (home.strength - away.strength) / 38 +
    (home.form - away.form) / 64 +
    (home.experience - away.experience) / 70 +
    (home.setPiece - away.setPiece) / 110 +
    homeRecentAttack -
    awayRecentDefense;
  const awayDataEdge =
    (away.attack - home.defense) / 26 +
    (away.strength - home.strength) / 38 +
    (away.form - home.form) / 64 +
    (away.experience - home.experience) / 70 +
    (away.setPiece - home.setPiece) / 110 +
    awayRecentAttack -
    homeRecentDefense;
  const homeQuality = (home.attack + home.strength + home.setPiece - 210) / 155;
  const awayQuality = (away.attack + away.strength + away.setPiece - 210) / 155;
  const homeGuaBoost = clamp(gua.homeBoost, -0.18, home.strength + 10 < away.strength ? 0.12 : 0.34);
  const awayGuaBoost = clamp(gua.awayBoost, -0.18, away.strength + 10 < home.strength ? 0.12 : 0.34);
  const sharedPace = gua.paceBoost * 0.72 + contextPace + scenario.highGoal * 0.18 + recentGoalLift;
  const homeLambda = clamp(1.12 + homeQuality + homeDataEdge * weights.data + homeGuaBoost * weights.liuyao * 0.92 + sharedPace + seedNoise * 0.35, 0.15, 5.2);
  const awayLambda = clamp(1.12 + awayQuality + awayDataEdge * weights.data + awayGuaBoost * weights.liuyao * 0.92 + sharedPace - seedNoise * 0.35, 0.15, 5.2);
  const targetHome = clamp(Math.round(homeLambda + homeGuaBoost * 0.35 + (home.attack - away.defense) / 120 + (home.strength - away.strength) / 160), 0, 5);
  const targetAway = clamp(Math.round(awayLambda + awayGuaBoost * 0.35 + (away.attack - home.defense) / 120 + (away.strength - home.strength) / 160), 0, 5);
  const candidates = [];
  for (let h = 0; h <= 5; h += 1) {
    for (let a = 0; a <= 5; a += 1) {
      const base = poisson(homeLambda, h) * poisson(awayLambda, a);
      const setPieceBump = Math.abs(h - a) <= 1 && h + a >= 1 ? (home.setPiece + away.setPiece) / 1900 : 0;
      const targetFit = h === targetHome && a === targetAway ? 0.34 : h === targetHome || a === targetAway ? 0.12 : 0;
      const guaFit = scoreFitByGua(gua, h, a, home, away);
      const omenBias = omenScoreBias(gua, h, a, home, away);
      const historyBias = historicalScoreBias(gua, h, a, home, away);
      const scenarioBias = scenarioScoreBias(scenario, h, a, home, away);
      const salt = 1 + (((hashText(`${gua.seed}|${h}-${a}|${match.home}|${match.away}`) % 29) - 14) / 120);
      const extremeBrake = h + a >= 7 ? 0.72 : 1;
      const plausibility = resultPlausibility(h, a, home, away);
      const raw = (base * guaFit + setPieceBump + targetFit * base + omenBias + historyBias + scenarioBias) * salt * extremeBrake * plausibility;
      candidates.push({ home: h, away: a, base, guaFit, omenBias, historyBias, scenarioBias, setPieceBump, targetFit, salt, plausibility, raw });
    }
  }
  candidates.forEach((candidate) => {
    candidate.modeRaw = modeScore(candidate, mode, gua, scenario, homeLambda, awayLambda, home, away);
  });
  candidates.sort((a, b) => b.modeRaw - a.modeRaw);
  const top = candidates.slice(0, 4);
  const topScore = top[0]?.modeRaw || 1;
  const scores = top.map((item) => ({
    ...item,
    probability: recommendationRate(item, top.indexOf(item), topScore, mode, gua, scenario, homeLambda, awayLambda, home, away),
    rationale: scoreRationale(item, mode, gua, scenario, homeLambda, awayLambda, home, away)
  }));
  return { match, home, away, gua, homeLambda, awayLambda, scores, recommendationMode: mode.name, scenario, recentGoalLift };
}

function populateMatchSelect(select) {
  if (!select) return;
  select.innerHTML = "";
  getSortedMatches().forEach((match) => {
    const option = document.createElement("option");
    option.value = match.id;
    option.textContent = fixtureTitle(match);
    if (state.match && match.id === state.match.id) option.selected = true;
    select.appendChild(option);
  });
}

function renderMatches() {
  const list = document.querySelector("#match-list");
  const select = document.querySelector("#match-select");
  const sortedMatches = getSortedMatches();
  populateMatchSelect(select);
  if (!list) return;
  list.innerHTML = "";
  sortedMatches.forEach((match) => {
    const card = document.createElement("article");
    card.className = `match-card${match.id === state.match.id ? " active" : ""}`;
    card.innerHTML = `
      <span>${displayStage(match.stage)} · ${match.timeCN}</span>
      <strong>${fixtureTitle(match)}</strong>
      <span>${displayVenue(match.venue)}</span>
      <b>${statusLabel(match)}</b>
      <small>点击进入起卦推演</small>
    `;
    card.addEventListener("click", () => {
      selectMatch(match, "./reading.html");
    });
    list.appendChild(card);
  });
}

function renderBracket() {
  const tree = document.querySelector("#bracket-tree");
  if (!tree) return;
  tree.innerHTML = bracketTree.rounds
    .map(
      (round) => `
        <section class="bracket-round">
          <h3>${round.name}</h3>
          <div class="bracket-matches">
            ${round.matches
              .map(
                (match) => `
                  <article class="bracket-match">
                    <span>${displayStage(match.label)}</span>
                    <strong class="${match.winner === match.home ? "winner" : ""}">${displayTeam(match.home)}</strong>
                    <strong class="${match.winner === match.away ? "winner" : ""}">${displayTeam(match.away)}</strong>
                    <em>${match.winner ? "晋级：" + displayTeam(match.winner) : "晋级待定"}</em>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `
    )
    .join("");
}

function renderStandings() {
  const board = document.querySelector("#standings-board");
  if (!board) return;
  const groups = standingsTable.groups || [];
  if (!groups.length) {
    board.innerHTML = `
      <article class="standings-empty">
        <strong>等待实时小组积分数据</strong>
        <p>上线后将通过 API-FOOTBALL 的 standings 接口自动读取各组积分、净胜球、进失球和排名。请确认 Netlify 环境变量里已经配置 FOOTBALL_API_KEY。</p>
      </article>
    `;
    return;
  }
  board.innerHTML = groups
    .map(
      (group) => `
        <section class="standings-group">
          <h3>${group.name}</h3>
          <div class="standings-table" role="table" aria-label="${group.name} 积分榜">
            <div class="standings-row standings-head" role="row">
              <span>排名</span>
              <span>球队</span>
              <span>赛</span>
              <span>胜</span>
              <span>平</span>
              <span>负</span>
              <span>进/失</span>
              <span>净</span>
              <span>分</span>
            </div>
            ${group.rows
              .map(
                (row) => `
                  <div class="standings-row${row.rank <= 2 ? " qualify" : ""}" role="row">
                    <span>${row.rank || "-"}</span>
                    <strong>${displayTeam(row.team)}</strong>
                    <span>${row.played}</span>
                    <span>${row.win}</span>
                    <span>${row.draw}</span>
                    <span>${row.lose}</span>
                    <span>${row.goalsFor}/${row.goalsAgainst}</span>
                    <span>${row.goalDiff > 0 ? "+" : ""}${row.goalDiff}</span>
                    <b>${row.points}</b>
                  </div>
                `
              )
              .join("")}
          </div>
        </section>
      `
    )
    .join("");
}

function renderHexagram(gua) {
  const hero = document.querySelector("#hero-hexagram");
  const box = document.querySelector("#hexagram-lines");
  const baseNode = document.querySelector("#base-gua");
  const changedNode = document.querySelector("#changed-gua");
  const shiYingNode = document.querySelector("#shi-ying");
  const usefulGodNode = document.querySelector("#useful-god");
  const html = gua.lines
    .slice()
    .reverse()
    .map((line) => `<div class="hex-line ${line.yin ? "broken" : "solid"} ${line.moving ? "moving" : ""}" title="${line.label}${line.role ? " · " + line.role : ""}"></div>`)
    .join("");
  if (hero) hero.innerHTML = html;
  if (box) box.innerHTML = html;
  if (baseNode) baseNode.textContent = gua.baseGua;
  if (changedNode) changedNode.textContent = gua.changedGua;
  if (shiYingNode) shiYingNode.textContent = gua.shiYing;
  if (usefulGodNode) usefulGodNode.textContent = gua.usefulGod;
}

function renderScores(forecast) {
  const list = document.querySelector("#score-list");
  if (!list) return;
  list.innerHTML = forecast.scores
    .map((score, index) => {
      const label = index === 0 ? "主推比分" : `备选比分 ${index}`;
      return `
        <article class="score-card">
          <span>${label}</span>
          <strong>${score.home} : ${score.away}</strong>
          <span>${displayTeam(forecast.match.home)} ${score.home}-${score.away} ${displayTeam(forecast.match.away)} · 推荐率 ${score.probability}%</span>
          <em>${score.rationale}</em>
          <div class="probability-bar"><i style="width:${score.probability}%"></i></div>
        </article>
      `;
    })
    .join("");
}

function renderScoreInsights(forecast) {
  const box = document.querySelector("#score-insights");
  if (!box) return;
  const { match, home, away, gua, scenario, homeLambda, awayLambda, scores, recommendationMode, recentGoalLift } = forecast;
  const homeName = displayTeam(match.home);
  const awayName = displayTeam(match.away);
  const top = scores[0];
  const totalGoalBand = top.home + top.away <= 2 ? "低到中比分区间" : "中高比分区间";
  const edgeText =
    homeLambda > awayLambda + 0.18
      ? `${homeName}的预期进球略高，主队方向更稳。`
      : awayLambda > homeLambda + 0.18
        ? `${awayName}的预期进球略高，客队存在抢结果能力。`
        : "双方预期进球接近，平局和一球差比分权重更高。";
  box.innerHTML = `
    <article class="panel data-panel">
      <h3>进球期望</h3>
      <dl class="metric-grid">
        <div><dt>${homeName}</dt><dd>${homeLambda.toFixed(2)}</dd></div>
        <div><dt>${awayName}</dt><dd>${awayLambda.toFixed(2)}</dd></div>
        <div><dt>比分带</dt><dd>${totalGoalBand}</dd></div>
        <div><dt>${recommendationMode}</dt><dd>${top.home}-${top.away}</dd></div>
      </dl>
      <p>${edgeText}本场卦门为“${gua.scoreGate}”：${gua.gateTone} 当前场景为“${scenario.name}”，${scenario.tone} 预期进球不是最终比分，而是把球员评分、球队攻防、比赛压力、往届比分基线、已完赛进球均值和卦象动爻合并后的进球重心。</p>
    </article>
    <article class="panel data-panel">
      <h3>比分为什么集中在这几组</h3>
      <p>六爻盘面显示“${gua.shiYing}”，${gua.usefulGod}。本场不是套用固定比分模板，而是先看世应强弱，再看子孙、官鬼、兄弟三类爻对进球、压力和胶着程度的牵引。</p>
      <p>当前 ${homeName} 综合实力 ${home.strength}、攻击 ${home.attack} / 防守 ${home.defense}，已赛 ${home.recent.played} 场，场均进球 ${home.recent.goalsForPerGame.toFixed(2)}；${awayName} 综合实力 ${away.strength}、攻击 ${away.attack} / 防守 ${away.defense}，已赛 ${away.recent.played} 场，场均进球 ${away.recent.goalsForPerGame.toFixed(2)}。已完赛进球修正为 ${recentGoalLift.toFixed(2)}。推荐率是单个比分的把握度，不要求四个比分加起来等于 100%。</p>
    </article>
    <article class="panel data-panel">
      <h3>发布口径</h3>
      <p>如果用于前台内容，可以先写主推比分 ${top.home}-${top.away}，再补充“备选比分覆盖了同一场比赛的两种走势”：一种来自 ${gua.scoreGate} 的主线，另一种来自“${scenario.name}”带来的积分压力修正。</p>
    </article>
  `;
}

function renderScenarioReadings() {
  const box = document.querySelector("#scenario-readings");
  if (!box) return;
  box.innerHTML = Object.keys(scenarioProfiles)
    .map((scenarioKey) => {
      const scenarioForecast = calculateForecast(scenarioKey);
      const scenario = scenarioForecast.scenario;
      const top = scenarioForecast.scores[0];
      const active = scenarioKey === state.context ? " active-scenario" : "";
      return `
        <article class="panel data-panel scenario-card${active}">
          <h3>${scenario.name}</h3>
          <dl class="metric-grid">
            <div><dt>主推比分</dt><dd>${top.home}-${top.away}</dd></div>
            <div><dt>推荐率</dt><dd>${top.probability}%</dd></div>
          </dl>
          <p>${scenario.tone}</p>
          <p>${top.rationale}</p>
        </article>
      `;
    })
    .join("");
}

function renderEvidence(forecast) {
  const { match, home, away, gua, scenario } = forecast;
  const homeName = displayTeam(match.home);
  const awayName = displayTeam(match.away);
  const liuyaoNode = document.querySelector("#liuyao-analysis");
  const playerNode = document.querySelector("#player-analysis");
  const historyNode = document.querySelector("#history-analysis");
  if (liuyaoNode) liuyaoNode.innerHTML = `
    <p>本卦为<strong>${gua.baseGua}</strong>，变卦为<strong>${gua.changedGua}</strong>。六爻里，世爻代表 ${homeName}，应爻代表 ${awayName}。当前盘面显示：${gua.shiYing}。</p>
    <p>${gua.usefulGod}。卦门为<strong>${gua.scoreGate}</strong>，${gua.gateTone} 当前比赛场景为<strong>${scenario.name}</strong>，${scenario.tone} 动爻数量为 ${gua.movingCount}，说明比赛不是机械套用小比分，而是要看进球爻、压力爻、积分压力和世应位置如何共同落到比分区间。</p>
  `;
  if (playerNode) playerNode.innerHTML = `
    <p>${homeName} 综合实力 ${home.strength}、攻击 ${home.attack}、防守 ${home.defense}、经验 ${home.experience}、已赛场均进球 ${home.recent.goalsForPerGame.toFixed(2)}；${awayName} 综合实力 ${away.strength}、攻击 ${away.attack}、防守 ${away.defense}、经验 ${away.experience}、已赛场均进球 ${away.recent.goalsForPerGame.toFixed(2)}。</p>
    <div class="player-table">
      ${[
        ...resolveTeamProfile(match.home).players.slice(0, 3).map((player) => ({ player, teamName: match.home })),
        ...resolveTeamProfile(match.away).players.slice(0, 3).map((player) => ({ player, teamName: match.away }))
      ]
        .map(({ player, teamName }) => `<div class="player-row"><span>${displayPlayerName(player, teamName)} · ${player.role}</span><b>${player.influence}</b></div>`)
        .join("")}
    </div>
  `;
  if (historyNode) historyNode.innerHTML = `
    <p>${homeName}：${resolveTeamProfile(match.home).recentExperience}</p>
    <p>${awayName}：${resolveTeamProfile(match.away).recentExperience}</p>
    <p>过往经验层不是直接决定比分，而是修正六爻与球员数据的极端值：大赛经验高的球队更容易守住比分，经验少但冲击力强的球队更容易制造单点爆冷。</p>
  `;
}

function renderEvidenceDetails(forecast) {
  const teamBox = document.querySelector("#team-data");
  const playerBox = document.querySelector("#player-data");
  const methodBox = document.querySelector("#method-data");
  if (!teamBox && !playerBox && !methodBox) return;
  const { match, home, away, gua, scenario } = forecast;
  const homeProfile = resolveTeamProfile(match.home);
  const awayProfile = resolveTeamProfile(match.away);
  const homeName = displayTeam(match.home);
  const awayName = displayTeam(match.away);
  if (teamBox) {
    teamBox.innerHTML = `
      <article class="panel data-panel">
        <h3>${homeName} 球队底盘</h3>
        <dl class="metric-grid">
          <div><dt>综合近况</dt><dd>${homeProfile.teamForm}</dd></div>
          <div><dt>实力基准</dt><dd>${home.baseline}</dd></div>
          <div><dt>综合实力</dt><dd>${home.strength}</dd></div>
          <div><dt>攻击</dt><dd>${homeProfile.attack}</dd></div>
          <div><dt>防守</dt><dd>${homeProfile.defense}</dd></div>
          <div><dt>门将</dt><dd>${homeProfile.goalkeeper}</dd></div>
          <div><dt>定位球</dt><dd>${homeProfile.setPiece}</dd></div>
          <div><dt>大赛经验</dt><dd>${homeProfile.tournamentExperience}</dd></div>
          <div><dt>已赛场均进球</dt><dd>${home.recent.goalsForPerGame.toFixed(2)}</dd></div>
        </dl>
        <p>${homeProfile.recentExperience}</p>
      </article>
      <article class="panel data-panel">
        <h3>${awayName} 球队底盘</h3>
        <dl class="metric-grid">
          <div><dt>综合近况</dt><dd>${awayProfile.teamForm}</dd></div>
          <div><dt>实力基准</dt><dd>${away.baseline}</dd></div>
          <div><dt>综合实力</dt><dd>${away.strength}</dd></div>
          <div><dt>攻击</dt><dd>${awayProfile.attack}</dd></div>
          <div><dt>防守</dt><dd>${awayProfile.defense}</dd></div>
          <div><dt>门将</dt><dd>${awayProfile.goalkeeper}</dd></div>
          <div><dt>定位球</dt><dd>${awayProfile.setPiece}</dd></div>
          <div><dt>大赛经验</dt><dd>${awayProfile.tournamentExperience}</dd></div>
          <div><dt>已赛场均进球</dt><dd>${away.recent.goalsForPerGame.toFixed(2)}</dd></div>
        </dl>
        <p>${awayProfile.recentExperience}</p>
      </article>
    `;
  }
  if (playerBox) {
    playerBox.innerHTML = [match.home, match.away]
      .map((teamName) => {
        const profile = resolveTeamProfile(teamName);
        return `
          <article class="panel data-panel">
            <h3>${displayTeam(teamName)} 核心球员影响力</h3>
            <div class="player-table rich-table">
              ${profile.players
                .map(
                  (player) => `
                    <div class="player-row">
                      <span>${displayPlayerName(player, teamName)} · ${player.role}</span>
                      <b>${player.influence}</b>
                      <small>攻 ${player.attack} / 创 ${player.creation} / 守 ${player.defense} / 状态 ${player.form}</small>
                    </div>
                  `
                )
                .join("")}
            </div>
          </article>
        `;
      })
      .join("");
  }
  if (methodBox) {
    methodBox.innerHTML = `
      <article class="panel data-panel">
        <h3>六爻与数据如何合流</h3>
        <p>世爻代表 ${homeName}，应爻代表 ${awayName}。本卦 ${gua.baseGua} 看比赛原始结构，变卦 ${gua.changedGua} 看临场走势。本场卦门为 ${gua.scoreGate}：${gua.gateTone}</p>
        <p>数据层不直接替代六爻，而是给“能不能进球、能不能守住”定上下限。攻击、创造力和定位球抬高进球期望；防守、门将和大赛经验压低失误风险。当前场景“${scenario.name}”会修正平局价值、冒险程度和净胜球需求，最终推荐率就是卦象方向、球队数据、历史比分形态和积分压力的交集。</p>
      </article>
    `;
  }
}

function renderReport(forecast) {
  const reportBody = document.querySelector("#report-body");
  if (!reportBody) return;
  const top = forecast.scores[0];
  const scoreText = forecast.scores.map((s) => `${s.home}-${s.away}（推荐率 ${s.probability}%）`).join("、");
  reportBody.innerHTML = `
    <h3>${fixtureTitle(forecast.match)} 六爻比分推演</h3>
    <p>本场主推比分为 <strong>${top.home}-${top.away}</strong>，其余备选比分为：${scoreText}。</p>
    <p>推演逻辑：当前采用<strong>${forecast.recommendationMode}</strong>，比赛场景为<strong>${forecast.scenario.name}</strong>，${forecast.scenario.tone} 六爻盘面以 ${forecast.gua.baseGua} 变 ${forecast.gua.changedGua} 为主线，卦门落在“${forecast.gua.scoreGate}”，${forecast.gua.gateTone} 世应关系显示“${forecast.gua.shiYing}”；球员数据层面，双方攻击、防守、门将与核心球员影响力共同决定预期进球区间；过往赛事经验用于修正大赛稳定性和爆冷风险。</p>
    <p>内容口径：发布时可以把重点放在“六爻显示的变盘窗口 + 核心球员能否兑现数据优势 + 大赛经验是否压住风险”。推荐率是单个比分的把握度，不是四个比分平分 100%。</p>
  `;
}

function renderAll() {
  if (!state.match) return;
  const selected = document.querySelector("#match-select");
  if (selected) selected.value = state.match.id;
  renderMatches();
  const forecast = calculateForecast();
  renderHexagram(forecast.gua);
  renderScores(forecast);
  renderScoreInsights(forecast);
  renderScenarioReadings();
  renderEvidence(forecast);
  renderEvidenceDetails(forecast);
  renderReport(forecast);
  renderStandings();
  renderBracket();
}

function bindForm() {
  const form = document.querySelector("#match-form");
  const select = document.querySelector("#match-select");
  const copyButton = document.querySelector("#copy-report");
  const saveRouteLinks = document.querySelectorAll("[data-save-route]");
  if (!form && !select && !copyButton && !saveRouteLinks.length) return;
  if (document.querySelector("#cast-time")) document.querySelector("#cast-time").value = state.castTime;
  if (document.querySelector("#data-weight")) document.querySelector("#data-weight").value = state.dataWeight;
  if (document.querySelector("#match-context")) document.querySelector("#match-context").value = state.context;
  const syncStateFromControls = () => {
    state.match = matches.find((match) => match.id === document.querySelector("#match-select")?.value) || state.match || matches[0];
    state.castTime = document.querySelector("#cast-time")?.value || state.castTime;
    state.dataWeight = document.querySelector("#data-weight")?.value || state.dataWeight;
    state.context = document.querySelector("#match-context")?.value || state.context;
    persistState();
  };
  if (form) form.addEventListener("submit", (event) => {
    event.preventDefault();
    syncStateFromControls();
    renderAll();
    if (form.dataset.redirect) window.location.href = form.dataset.redirect;
  });
  if (select) select.addEventListener("change", (event) => {
    state.match = matches.find((match) => match.id === event.target.value) || matches[0];
    persistState();
    renderAll();
  });
  saveRouteLinks.forEach((link) => {
    link.addEventListener("click", () => {
      syncStateFromControls();
    });
  });
  if (copyButton) copyButton.addEventListener("click", async () => {
    const text = document.querySelector("#report-body")?.innerText || "";
    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = "已复制";
      setTimeout(() => (copyButton.textContent = "复制报告"), 1200);
    } catch {
      copyButton.textContent = "复制失败";
    }
  });
}

function bindBackToTop() {
  const button = document.querySelector("#back-to-top");
  if (!button) return;
  const toggle = () => {
    button.classList.toggle("visible", window.scrollY > 320);
  };
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", toggle, { passive: true });
  toggle();
}

function drawSky() {
  const canvas = document.querySelector("#sky");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const points = Array.from({ length: 70 }, (_, i) => ({ x: (i * 137) % width, y: (i * 83) % height, r: 0.8 + (i % 4) * 0.4 }));
  function frame(time) {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(244,234,213,.16)";
    ctx.fillStyle = "rgba(244,234,213,.42)";
    points.forEach((point, i) => {
      const y = (point.y + time * 0.004) % height;
      ctx.beginPath();
      ctx.arc(point.x, y, point.r, 0, Math.PI * 2);
      ctx.fill();
      if (i % 8 === 0) {
        const next = points[(i + 11) % points.length];
        ctx.beginPath();
        ctx.moveTo(point.x, y);
        ctx.lineTo(next.x, (next.y + time * 0.004) % height);
        ctx.stroke();
      }
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

syncActiveMatchToNearest();
bindForm();
bindBackToTop();
loadLiveData().finally(renderAll);
drawSky();
window.addEventListener("resize", drawSky);
