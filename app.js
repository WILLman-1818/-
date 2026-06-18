const matches = window.LIUYAO_MATCHES || [];
const teams = window.TEAM_PROFILES || {};
let bracketTree = window.WORLD_CUP_BRACKET || { rounds: [] };

const guaNames = ["乾为天", "坤为地", "水雷屯", "山水蒙", "水火既济", "雷火丰", "风雷益", "泽火革", "山泽损", "火地晋"];
const lineLabels = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

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
    const localMatch = matches.find((match) => match.id === liveMatch.id);
    if (!localMatch) {
      matches.push(liveMatch);
      return;
    }
    if (localMatch.locked || localMatch.status === "archived" || localMatch.status === "finished") return;
    Object.assign(localMatch, liveMatch);
  });
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

function teamPower(teamName) {
  const team = teams[teamName];
  const players = team.players;
  const attackCore = weightedAverage(players, "attack") * 0.32 + weightedAverage(players, "creation") * 0.24 + team.attack * 0.24 + team.teamForm * 0.2;
  const defenseCore = weightedAverage(players, "defense") * 0.28 + team.defense * 0.28 + team.goalkeeper * 0.24 + team.teamForm * 0.2;
  const experienceCore = team.tournamentExperience * 0.58 + team.teamForm * 0.22 + team.setPiece * 0.2;
  return {
    attack: Math.round(attackCore),
    defense: Math.round(defenseCore),
    experience: Math.round(experienceCore),
    setPiece: team.setPiece,
    form: team.teamForm,
    players
  };
}

function castHexagram(match, castTime) {
  const seed = hashText(`${match.id}|${castTime}|${match.home}|${match.away}`);
  const lines = Array.from({ length: 6 }, (_, index) => {
    const value = (seed >> (index * 3)) & 7;
    return {
      yin: value % 2 === 0,
      moving: value === 0 || value === 3 || value === 6,
      label: lineLabels[index],
      role: index === 2 ? "世" : index === 5 ? "应" : ""
    };
  });
  const movingCount = lines.filter((line) => line.moving).length;
  const shiLine = lines[2];
  const yingLine = lines[5];
  const homeBoost = (shiLine.moving ? -0.12 : 0.08) + (shiLine.yin ? -0.04 : 0.06);
  const awayBoost = (yingLine.moving ? 0.14 : -0.04) + (yingLine.yin ? -0.02 : 0.08);
  return {
    seed,
    lines,
    movingCount,
    baseGua: guaNames[seed % guaNames.length],
    changedGua: guaNames[(seed >>> 5) % guaNames.length],
    usefulGod: movingCount >= 3 ? "子孙爻旺，主进球机会偏多" : "子孙爻守，进球窗口偏集中",
    shiYing: homeBoost >= awayBoost ? "世爻较稳，主队不易崩盘" : "应爻发动，客队更容易抢到结果",
    homeBoost,
    awayBoost
  };
}

function poisson(lambda, k) {
  let factorial = 1;
  for (let i = 2; i <= k; i += 1) factorial *= i;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial;
}

function calculateForecast() {
  const match = state.match;
  const home = teamPower(match.home);
  const away = teamPower(match.away);
  const gua = castHexagram(match, state.castTime);
  const weights = {
    balanced: { liuyao: 0.55, data: 0.45 },
    liuyao: { liuyao: 0.7, data: 0.3 },
    data: { liuyao: 0.35, data: 0.65 }
  }[state.dataWeight];
  const contextPace = { group: 0.08, mustwin: 0.22, cautious: -0.18 }[state.context];
  const homeDataEdge = (home.attack - away.defense) / 34 + (home.experience - away.experience) / 80;
  const awayDataEdge = (away.attack - home.defense) / 34 + (away.experience - home.experience) / 80;
  const homeLambda = clamp(1.15 + homeDataEdge * weights.data + gua.homeBoost * weights.liuyao + contextPace, 0.35, 3.8);
  const awayLambda = clamp(1.1 + awayDataEdge * weights.data + gua.awayBoost * weights.liuyao + contextPace, 0.35, 3.8);
  const candidates = [];
  for (let h = 0; h <= 4; h += 1) {
    for (let a = 0; a <= 4; a += 1) {
      const base = poisson(homeLambda, h) * poisson(awayLambda, a);
      const setPieceBump = Math.abs(h - a) <= 1 ? (home.setPiece + away.setPiece) / 2400 : 0;
      candidates.push({ home: h, away: a, raw: base + setPieceBump });
    }
  }
  candidates.sort((a, b) => b.raw - a.raw);
  const top = candidates.slice(0, 4);
  const total = top.reduce((sum, item) => sum + item.raw, 0);
  const scores = top.map((item) => ({
    ...item,
    probability: Math.round((item.raw / total) * 100)
  }));
  const diff = 100 - scores.reduce((sum, item) => sum + item.probability, 0);
  scores[0].probability += diff;
  return { match, home, away, gua, homeLambda, awayLambda, scores };
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
          <span>${displayTeam(forecast.match.home)} ${score.home}-${score.away} ${displayTeam(forecast.match.away)} · 概率 ${score.probability}%</span>
          <div class="probability-bar"><i style="width:${score.probability}%"></i></div>
        </article>
      `;
    })
    .join("");
}

function renderScoreInsights(forecast) {
  const box = document.querySelector("#score-insights");
  if (!box) return;
  const { match, home, away, gua, homeLambda, awayLambda, scores } = forecast;
  const homeName = displayTeam(match.home);
  const awayName = displayTeam(match.away);
  const top = scores[0];
  const totalGoalBand = top.home + top.away <= 2 ? "低到中比分区间" : "中高比分区间";
  const edgeText =
    homeLambda > awayLambda + 0.18
      ? `${homeName} 的预期进球略高，主队方向更稳。`
      : awayLambda > homeLambda + 0.18
        ? `${awayName} 的预期进球略高，客队存在抢结果能力。`
        : "双方预期进球接近，平局和一球差比分权重更高。";
  box.innerHTML = `
    <article class="panel data-panel">
      <h3>进球期望</h3>
      <dl class="metric-grid">
        <div><dt>${homeName}</dt><dd>${homeLambda.toFixed(2)}</dd></div>
        <div><dt>${awayName}</dt><dd>${awayLambda.toFixed(2)}</dd></div>
        <div><dt>比分带</dt><dd>${totalGoalBand}</dd></div>
        <div><dt>主推</dt><dd>${top.home}-${top.away}</dd></div>
      </dl>
      <p>${edgeText}预期进球不是最终比分，而是把球员评分、球队攻防、比赛压力和卦象动爻合并后的进球重心。</p>
    </article>
    <article class="panel data-panel">
      <h3>比分为什么集中在这几组</h3>
      <p>六爻盘面显示“${gua.shiYing}”，${gua.usefulGod}。当世应差距不大时，模型会把概率集中在 1 球差和小比分平局；当动爻数量增加时，2-1、1-2、2-2 这类变盘比分会被抬高。</p>
      <p>当前 ${homeName} 攻击 ${home.attack} / 防守 ${home.defense}，${awayName} 攻击 ${away.attack} / 防守 ${away.defense}。双方防守和门将评分共同压住极端大比分，所以系统只输出最有内容解释价值的 4 个候选比分。</p>
    </article>
    <article class="panel data-panel">
      <h3>发布口径</h3>
      <p>如果用于前台内容，可以先写主推比分 ${top.home}-${top.away}，再补充“备选比分覆盖了同一场比赛的两种走势”：一种是世爻稳定、主队守住节奏；另一种是应爻发动、客队在转换或定位球里打出进球。</p>
    </article>
  `;
}

function renderEvidence(forecast) {
  const { match, home, away, gua } = forecast;
  const homeName = displayTeam(match.home);
  const awayName = displayTeam(match.away);
  const liuyaoNode = document.querySelector("#liuyao-analysis");
  const playerNode = document.querySelector("#player-analysis");
  const historyNode = document.querySelector("#history-analysis");
  if (liuyaoNode) liuyaoNode.innerHTML = `
    <p>本卦为<strong>${gua.baseGua}</strong>，变卦为<strong>${gua.changedGua}</strong>。六爻里，世爻代表 ${homeName}，应爻代表 ${awayName}。当前盘面显示：${gua.shiYing}。</p>
    <p>${gua.usefulGod}。动爻数量为 ${gua.movingCount}，说明比赛不是单纯低速消耗局，而是存在明确变盘窗口。若应爻发动强于世爻，客队的进球概率会被抬高；若世爻稳定，主队至少有守住基本盘的能力。</p>
  `;
  if (playerNode) playerNode.innerHTML = `
    <p>${homeName} 攻击 ${home.attack}、防守 ${home.defense}、经验 ${home.experience}；${awayName} 攻击 ${away.attack}、防守 ${away.defense}、经验 ${away.experience}。</p>
    <div class="player-table">
      ${[
        ...teams[match.home].players.slice(0, 3).map((player) => ({ player, teamName: match.home })),
        ...teams[match.away].players.slice(0, 3).map((player) => ({ player, teamName: match.away }))
      ]
        .map(({ player, teamName }) => `<div class="player-row"><span>${displayPlayerName(player, teamName)} · ${player.role}</span><b>${player.influence}</b></div>`)
        .join("")}
    </div>
  `;
  if (historyNode) historyNode.innerHTML = `
    <p>${homeName}：${teams[match.home].recentExperience}</p>
    <p>${awayName}：${teams[match.away].recentExperience}</p>
    <p>过往经验层不是直接决定比分，而是修正六爻与球员数据的极端值：大赛经验高的球队更容易守住比分，经验少但冲击力强的球队更容易制造单点爆冷。</p>
  `;
}

function renderEvidenceDetails(forecast) {
  const teamBox = document.querySelector("#team-data");
  const playerBox = document.querySelector("#player-data");
  const methodBox = document.querySelector("#method-data");
  if (!teamBox && !playerBox && !methodBox) return;
  const { match, home, away, gua } = forecast;
  const homeProfile = teams[match.home];
  const awayProfile = teams[match.away];
  const homeName = displayTeam(match.home);
  const awayName = displayTeam(match.away);
  if (teamBox) {
    teamBox.innerHTML = `
      <article class="panel data-panel">
        <h3>${homeName} 球队底盘</h3>
        <dl class="metric-grid">
          <div><dt>综合近况</dt><dd>${homeProfile.teamForm}</dd></div>
          <div><dt>攻击</dt><dd>${homeProfile.attack}</dd></div>
          <div><dt>防守</dt><dd>${homeProfile.defense}</dd></div>
          <div><dt>门将</dt><dd>${homeProfile.goalkeeper}</dd></div>
          <div><dt>定位球</dt><dd>${homeProfile.setPiece}</dd></div>
          <div><dt>大赛经验</dt><dd>${homeProfile.tournamentExperience}</dd></div>
        </dl>
        <p>${homeProfile.recentExperience}</p>
      </article>
      <article class="panel data-panel">
        <h3>${awayName} 球队底盘</h3>
        <dl class="metric-grid">
          <div><dt>综合近况</dt><dd>${awayProfile.teamForm}</dd></div>
          <div><dt>攻击</dt><dd>${awayProfile.attack}</dd></div>
          <div><dt>防守</dt><dd>${awayProfile.defense}</dd></div>
          <div><dt>门将</dt><dd>${awayProfile.goalkeeper}</dd></div>
          <div><dt>定位球</dt><dd>${awayProfile.setPiece}</dd></div>
          <div><dt>大赛经验</dt><dd>${awayProfile.tournamentExperience}</dd></div>
        </dl>
        <p>${awayProfile.recentExperience}</p>
      </article>
    `;
  }
  if (playerBox) {
    playerBox.innerHTML = [match.home, match.away]
      .map((teamName) => {
        const profile = teams[teamName];
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
        <p>世爻代表 ${homeName}，应爻代表 ${awayName}。本卦 ${gua.baseGua} 看比赛原始结构，变卦 ${gua.changedGua} 看临场走势。动爻越多，越容易出现阶段性反转、临门一脚失衡或定位球改变比分。</p>
        <p>数据层不直接替代六爻，而是给“能不能进球、能不能守住”定上下限。攻击、创造力和定位球抬高进球期望；防守、门将和大赛经验压低失误概率。最终比分概率就是卦象方向和数据边界的交集。</p>
      </article>
    `;
  }
}

function renderReport(forecast) {
  const reportBody = document.querySelector("#report-body");
  if (!reportBody) return;
  const top = forecast.scores[0];
  const scoreText = forecast.scores.map((s) => `${s.home}-${s.away}（${s.probability}%）`).join("、");
  reportBody.innerHTML = `
    <h3>${fixtureTitle(forecast.match)} 六爻比分推演</h3>
    <p>本场主推比分为 <strong>${top.home}-${top.away}</strong>，其余备选比分为：${scoreText}。</p>
    <p>推演逻辑：六爻盘面以 ${forecast.gua.baseGua} 变 ${forecast.gua.changedGua} 为主线，世应关系显示“${forecast.gua.shiYing}”；球员数据层面，双方攻击、防守、门将与核心球员影响力共同决定预期进球区间；过往赛事经验用于修正大赛稳定性和爆冷风险。</p>
    <p>内容口径：发布时可以把重点放在“六爻显示的变盘窗口 + 核心球员能否兑现数据优势 + 大赛经验是否压住风险”。这比只说一个比分更容易让读者理解为什么会出现这组概率。</p>
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
  renderEvidence(forecast);
  renderEvidenceDetails(forecast);
  renderReport(forecast);
  renderBracket();
}

function bindForm() {
  const form = document.querySelector("#match-form");
  const select = document.querySelector("#match-select");
  const copyButton = document.querySelector("#copy-report");
  if (!form && !select && !copyButton) return;
  if (document.querySelector("#cast-time")) document.querySelector("#cast-time").value = state.castTime;
  if (document.querySelector("#data-weight")) document.querySelector("#data-weight").value = state.dataWeight;
  if (document.querySelector("#match-context")) document.querySelector("#match-context").value = state.context;
  if (form) form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.match = matches.find((match) => match.id === document.querySelector("#match-select")?.value) || matches[0];
    state.castTime = document.querySelector("#cast-time")?.value || state.castTime;
    state.dataWeight = document.querySelector("#data-weight")?.value || state.dataWeight;
    state.context = document.querySelector("#match-context")?.value || state.context;
    persistState();
    renderAll();
  });
  if (select) select.addEventListener("change", (event) => {
    state.match = matches.find((match) => match.id === event.target.value) || matches[0];
    persistState();
    renderAll();
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
