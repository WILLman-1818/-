const matches = window.LIUYAO_MATCHES || [];
const teams = window.TEAM_PROFILES || {};
let bracketTree = window.WORLD_CUP_BRACKET || { rounds: [] };

const guaNames = ["乾为天", "坤为地", "水雷屯", "山水蒙", "水火既济", "雷火丰", "风雷益", "泽火革", "山泽损", "火地晋"];
const lineLabels = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

let state = {
  match: matches[0],
  castTime: "2026-06-18T01:00",
  dataWeight: "balanced",
  context: "group"
};

async function loadLiveData() {
  try {
    const response = await fetch("/.netlify/functions/live-data", { cache: "no-store" });
    if (!response.ok) throw new Error("live endpoint unavailable");
    const payload = await response.json();
    mergeLiveMatches(payload.matches || []);
    mergeLiveTeams(payload.teams || {});
    if (payload.bracket) bracketTree = payload.bracket;
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

function renderMatches() {
  const list = document.querySelector("#match-list");
  const select = document.querySelector("#match-select");
  list.innerHTML = "";
  select.innerHTML = "";
  matches.forEach((match) => {
    const card = document.createElement("article");
    card.className = `match-card${match.id === state.match.id ? " active" : ""}`;
    card.innerHTML = `
      <span>${match.stage} · ${match.timeCN}</span>
      <strong>${match.home} vs ${match.away}</strong>
      <span>${match.venue}</span>
      <b>${match.locked ? "已归档，不再实时更新" : match.context}</b>
    `;
    card.addEventListener("click", () => {
      state.match = match;
      renderAll();
      document.querySelector("#reading").scrollIntoView({ behavior: "smooth" });
    });
    list.appendChild(card);

    const option = document.createElement("option");
    option.value = match.id;
    option.textContent = `${match.home} vs ${match.away}`;
    if (match.id === state.match.id) option.selected = true;
    select.appendChild(option);
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
                    <span>${match.label}</span>
                    <strong class="${match.winner === match.home ? "winner" : ""}">${match.home || "待定"}</strong>
                    <strong class="${match.winner === match.away ? "winner" : ""}">${match.away || "待定"}</strong>
                    <em>${match.winner ? "晋级：" + match.winner : "晋级待定"}</em>
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
  const html = gua.lines
    .slice()
    .reverse()
    .map((line) => `<div class="hex-line ${line.yin ? "broken" : "solid"} ${line.moving ? "moving" : ""}" title="${line.label}${line.role ? " · " + line.role : ""}"></div>`)
    .join("");
  hero.innerHTML = html;
  box.innerHTML = html;
  document.querySelector("#base-gua").textContent = gua.baseGua;
  document.querySelector("#changed-gua").textContent = gua.changedGua;
  document.querySelector("#shi-ying").textContent = gua.shiYing;
  document.querySelector("#useful-god").textContent = gua.usefulGod;
}

function renderScores(forecast) {
  const list = document.querySelector("#score-list");
  list.innerHTML = forecast.scores
    .map((score, index) => {
      const label = index === 0 ? "主推比分" : `备选比分 ${index}`;
      return `
        <article class="score-card">
          <span>${label}</span>
          <strong>${score.home} : ${score.away}</strong>
          <span>${forecast.match.home} ${score.home}-${score.away} ${forecast.match.away} · 概率 ${score.probability}%</span>
          <div class="probability-bar"><i style="width:${score.probability}%"></i></div>
        </article>
      `;
    })
    .join("");
}

function renderEvidence(forecast) {
  const { match, home, away, gua } = forecast;
  document.querySelector("#liuyao-analysis").innerHTML = `
    <p>本卦为<strong>${gua.baseGua}</strong>，变卦为<strong>${gua.changedGua}</strong>。六爻里，世爻代表 ${match.home}，应爻代表 ${match.away}。当前盘面显示：${gua.shiYing}。</p>
    <p>${gua.usefulGod}。动爻数量为 ${gua.movingCount}，说明比赛不是单纯低速消耗局，而是存在明确变盘窗口。若应爻发动强于世爻，客队的进球概率会被抬高；若世爻稳定，主队至少有守住基本盘的能力。</p>
  `;
  document.querySelector("#player-analysis").innerHTML = `
    <p>${match.home} 攻击 ${home.attack}、防守 ${home.defense}、经验 ${home.experience}；${match.away} 攻击 ${away.attack}、防守 ${away.defense}、经验 ${away.experience}。</p>
    <div class="player-table">
      ${[...teams[match.home].players.slice(0, 3), ...teams[match.away].players.slice(0, 3)]
        .map((player) => `<div class="player-row"><span>${player.name} · ${player.role}</span><b>${player.influence}</b></div>`)
        .join("")}
    </div>
  `;
  document.querySelector("#history-analysis").innerHTML = `
    <p>${match.home}：${teams[match.home].recentExperience}</p>
    <p>${match.away}：${teams[match.away].recentExperience}</p>
    <p>过往经验层不是直接决定比分，而是修正六爻与球员数据的极端值：大赛经验高的球队更容易守住比分，经验少但冲击力强的球队更容易制造单点爆冷。</p>
  `;
}

function renderReport(forecast) {
  const top = forecast.scores[0];
  const scoreText = forecast.scores.map((s) => `${s.home}-${s.away}（${s.probability}%）`).join("、");
  document.querySelector("#report-body").innerHTML = `
    <h3>${forecast.match.home} vs ${forecast.match.away} 六爻比分推演</h3>
    <p>本场主推比分为 <strong>${top.home}-${top.away}</strong>，其余备选比分为：${scoreText}。</p>
    <p>推演逻辑：六爻盘面以 ${forecast.gua.baseGua} 变 ${forecast.gua.changedGua} 为主线，世应关系显示“${forecast.gua.shiYing}”；球员数据层面，双方攻击、防守、门将与核心球员影响力共同决定预期进球区间；过往赛事经验用于修正大赛稳定性和爆冷风险。</p>
    <p>内容口径：发布时可以把重点放在“六爻显示的变盘窗口 + 核心球员能否兑现数据优势 + 大赛经验是否压住风险”。这比只说一个比分更容易让读者理解为什么会出现这组概率。</p>
  `;
}

function renderAll() {
  document.querySelector("#match-select").value = state.match.id;
  renderMatches();
  const forecast = calculateForecast();
  renderHexagram(forecast.gua);
  renderScores(forecast);
  renderEvidence(forecast);
  renderReport(forecast);
  renderBracket();
}

function bindForm() {
  document.querySelector("#match-form").addEventListener("submit", (event) => {
    event.preventDefault();
    state.match = matches.find((match) => match.id === document.querySelector("#match-select").value) || matches[0];
    state.castTime = document.querySelector("#cast-time").value;
    state.dataWeight = document.querySelector("#data-weight").value;
    state.context = document.querySelector("#match-context").value;
    renderAll();
  });
  document.querySelector("#match-select").addEventListener("change", (event) => {
    state.match = matches.find((match) => match.id === event.target.value) || matches[0];
    renderAll();
  });
  document.querySelector("#copy-report").addEventListener("click", async () => {
    const text = document.querySelector("#report-body").innerText;
    try {
      await navigator.clipboard.writeText(text);
      document.querySelector("#copy-report").textContent = "已复制";
      setTimeout(() => (document.querySelector("#copy-report").textContent = "复制报告"), 1200);
    } catch {
      document.querySelector("#copy-report").textContent = "复制失败";
    }
  });
}

function drawSky() {
  const canvas = document.querySelector("#sky");
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

bindForm();
loadLiveData().finally(renderAll);
drawSky();
window.addEventListener("resize", drawSky);
