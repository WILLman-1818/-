const API_BASE = "https://v3.football.api-sports.io";
const DEFAULT_LEAGUE_ID = "1";
const DEFAULT_SEASON = "2026";
const DEFAULT_TIMEZONE = "Asia/Shanghai";

exports.handler = async () => {
  const apiKey = process.env.FOOTBALL_API_KEY;
  const leagueId = process.env.FOOTBALL_LEAGUE_ID || DEFAULT_LEAGUE_ID;
  const season = process.env.FOOTBALL_SEASON || DEFAULT_SEASON;
  const timezone = process.env.FOOTBALL_TIMEZONE || DEFAULT_TIMEZONE;

  if (!apiKey) {
    return json({
      source: "local-fallback",
      updatedAt: new Date().toISOString(),
      matches: [],
      teams: {},
      bracket: null,
      message: "FOOTBALL_API_KEY is not configured. Frontend will use local sample data."
    });
  }

  try {
    const fixtures = await apiFootball("/fixtures", { league: leagueId, season, timezone }, apiKey);
    const teams = await apiFootball("/teams", { league: leagueId, season }, apiKey);
    const normalizedMatches = normalizeFixtures(fixtures.response || []);
    const normalizedTeams = normalizeTeams(teams.response || [], normalizedMatches);
    const bracket = buildBracket(normalizedMatches);

    return json({
      source: "API-FOOTBALL",
      updatedAt: new Date().toISOString(),
      matches: normalizedMatches,
      teams: normalizedTeams,
      bracket
    });
  } catch (error) {
    return json(
      {
        source: "api-football-error",
        updatedAt: new Date().toISOString(),
        matches: [],
        teams: {},
        bracket: null,
        message: error.message
      },
      502
    );
  }
};

async function apiFootball(path, params, apiKey) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`API-FOOTBALL request failed: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors && Object.keys(payload.errors).length > 0) {
    throw new Error(`API-FOOTBALL errors: ${JSON.stringify(payload.errors)}`);
  }
  return payload;
}

function normalizeFixtures(fixtures) {
  return fixtures.map((item) => {
    const fixture = item.fixture || {};
    const league = item.league || {};
    const teams = item.teams || {};
    const goals = item.goals || {};
    const statusShort = fixture.status?.short || "NS";
    const isFinished = ["FT", "AET", "PEN"].includes(statusShort);
    const kickoff = fixture.date ? new Date(fixture.date) : null;

    return {
      id: String(fixture.id),
      date: kickoff ? kickoff.toISOString().slice(0, 10) : "",
      timeET: kickoff
        ? kickoff.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" })
        : "",
      timeCN: kickoff
        ? kickoff.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Shanghai"
          })
        : "",
      stage: `${league.name || "World Cup"} · ${league.round || ""}`.trim(),
      venue: fixture.venue?.name || "",
      status: isFinished ? "archived" : statusShort === "NS" ? "scheduled" : "live",
      locked: isFinished,
      home: teams.home?.name || "待定",
      away: teams.away?.name || "待定",
      homeScore: goals.home,
      awayScore: goals.away,
      context: isFinished ? "已完赛，进入历史归档，不再实时覆盖。" : "实时赛程数据，赛前请继续关注首发、伤停与阵容变化。",
      sourceNote: "API-FOOTBALL 实时赛程"
    };
  });
}

function normalizeTeams(teamRows, matches) {
  const teamSet = new Set(matches.flatMap((match) => [match.home, match.away]));
  const result = {};

  teamRows.forEach((row) => {
    const teamName = row.team?.name;
    if (!teamName || !teamSet.has(teamName)) return;
    const seed = hashText(teamName);
    result[teamName] = makeTeamProfile(teamName, seed);
  });

  teamSet.forEach((teamName) => {
    if (!result[teamName] && teamName !== "待定") {
      result[teamName] = makeTeamProfile(teamName, hashText(teamName));
    }
  });

  return result;
}

function makeTeamProfile(teamName, seed) {
  const attack = 66 + (seed % 23);
  const defense = 64 + ((seed >> 3) % 23);
  const goalkeeper = 63 + ((seed >> 6) % 24);
  const teamForm = Math.round((attack + defense + goalkeeper) / 3);
  const setPiece = 62 + ((seed >> 9) % 25);
  const tournamentExperience = 56 + ((seed >> 12) % 35);

  return {
    teamForm,
    attack,
    defense,
    goalkeeper,
    setPiece,
    tournamentExperience,
    recentExperience: "来自实时赛程接口的球队，球员深度数据待接入 players/statistics 后进一步校准。",
    players: [
      { name: `${teamName} 核心前锋`, role: "前锋", influence: attack, attack, creation: attack - 4, defense: 42, form: teamForm },
      { name: `${teamName} 中场核心`, role: "中场", influence: teamForm, attack: attack - 8, creation: attack, defense: defense - 4, form: teamForm },
      { name: `${teamName} 防线核心`, role: "后卫", influence: defense, attack: 42, creation: 48, defense, form: teamForm },
      { name: `${teamName} 门将`, role: "门将", influence: goalkeeper, attack: 8, creation: 34, defense: goalkeeper, form: teamForm }
    ]
  };
}

function buildBracket(matches) {
  const knockoutMatches = matches.filter((match) => /Round of 32|Round of 16|Quarter|Semi|Final/i.test(match.stage));
  const roundMap = [
    ["32 强", /Round of 32/i],
    ["16 强", /Round of 16/i],
    ["8 强", /Quarter/i],
    ["半决赛", /Semi/i],
    ["决赛", /Final/i]
  ];

  const rounds = roundMap.map(([name, pattern]) => {
    const roundMatches = knockoutMatches.filter((match) => pattern.test(match.stage));
    return {
      name,
      matches: (roundMatches.length ? roundMatches : placeholderMatches(name)).map((match, index) => {
        if (match.id) {
          return {
            id: match.id,
            label: match.stage,
            home: match.home,
            away: match.away,
            winner: inferWinner(match)
          };
        }
        return match;
      })
    };
  });

  return { updatedAt: new Date().toISOString(), rounds };
}

function placeholderMatches(roundName) {
  const count = { "32 强": 8, "16 强": 4, "8 强": 2, "半决赛": 1, "决赛": 1 }[roundName] || 1;
  return Array.from({ length: count }, (_, index) => ({
    id: `${roundName}-${index + 1}`,
    label: `${roundName} 对阵 ${index + 1}`,
    home: "待定",
    away: "待定",
    winner: ""
  }));
}

function inferWinner(match) {
  if (match.status !== "archived") return "";
  if (typeof match.homeScore !== "number" || typeof match.awayScore !== "number") return "";
  if (match.homeScore > match.awayScore) return match.home;
  if (match.awayScore > match.homeScore) return match.away;
  return "";
}

function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function json(payload, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60"
    },
    body: JSON.stringify(payload)
  };
}
