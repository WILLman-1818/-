window.LIUYAO_MATCHES = [
  {
    id: "por-cod-2026-06-17",
    date: "2026-06-17",
    timeET: "13:00",
    timeCN: "2026-06-18 01:00",
    stage: "世界杯小组赛 K 组",
    venue: "Houston Stadium",
    status: "archived",
    locked: true,
    home: "葡萄牙",
    away: "刚果民主共和国",
    context: "葡萄牙控球预期更高，但刚果民主共和国具备反击与定位球威胁。",
    sourceNote: "参考公开赛程与赛后报道；球员评分为内容原型字段，正式发布前需接实时数据。"
  },
  {
    id: "eng-cro-2026-06-17",
    date: "2026-06-17",
    timeET: "16:00",
    timeCN: "2026-06-18 04:00",
    stage: "世界杯小组赛 L 组",
    venue: "Dallas Stadium",
    status: "archived",
    locked: true,
    home: "英格兰",
    away: "克罗地亚",
    context: "英格兰前场天赋更足，克罗地亚大赛经验和中场控制仍有韧性。",
    sourceNote: "参考公开赛程与赛后球员表现报道；球员评分为内容原型字段。"
  },
  {
    id: "gha-pan-2026-06-17",
    date: "2026-06-17",
    timeET: "19:00",
    timeCN: "2026-06-18 07:00",
    stage: "世界杯小组赛 L 组",
    venue: "Toronto Stadium",
    status: "archived",
    locked: true,
    home: "加纳",
    away: "巴拿马",
    context: "双方都需要抢分，比赛更可能出现身体对抗、转换进攻和定位球机会。",
    sourceNote: "公开赛程样例；球员评分为内容原型字段。"
  },
  {
    id: "uzb-col-2026-06-17",
    date: "2026-06-17",
    timeET: "22:00",
    timeCN: "2026-06-18 10:00",
    stage: "世界杯小组赛 K 组",
    venue: "Mexico City Stadium",
    status: "archived",
    locked: true,
    home: "乌兹别克斯坦",
    away: "哥伦比亚",
    context: "哥伦比亚个人能力和南美比赛经验更强，乌兹别克斯坦会依赖整体防守与反击。",
    sourceNote: "公开赛程样例；球员评分为内容原型字段。"
  }
];

window.WORLD_CUP_BRACKET = {
  updatedAt: "2026-06-18T00:00:00+08:00",
  rounds: [
    {
      name: "32 强",
      matches: [
        { id: "r32-01", label: "A 组第 1 vs B 组第 2", home: "待定", away: "待定", winner: "" },
        { id: "r32-02", label: "C 组第 1 vs D 组第 2", home: "待定", away: "待定", winner: "" },
        { id: "r32-03", label: "E 组第 1 vs F 组第 2", home: "待定", away: "待定", winner: "" },
        { id: "r32-04", label: "G 组第 1 vs H 组第 2", home: "待定", away: "待定", winner: "" },
        { id: "r32-05", label: "I 组第 1 vs J 组第 2", home: "待定", away: "待定", winner: "" },
        { id: "r32-06", label: "K 组第 1 vs L 组第 2", home: "待定", away: "待定", winner: "" },
        { id: "r32-07", label: "B 组第 1 vs A 组第 2", home: "待定", away: "待定", winner: "" },
        { id: "r32-08", label: "D 组第 1 vs C 组第 2", home: "待定", away: "待定", winner: "" }
      ]
    },
    {
      name: "16 强",
      matches: [
        { id: "r16-01", label: "R32 胜者 1 vs R32 胜者 2", home: "待定", away: "待定", winner: "" },
        { id: "r16-02", label: "R32 胜者 3 vs R32 胜者 4", home: "待定", away: "待定", winner: "" },
        { id: "r16-03", label: "R32 胜者 5 vs R32 胜者 6", home: "待定", away: "待定", winner: "" },
        { id: "r16-04", label: "R32 胜者 7 vs R32 胜者 8", home: "待定", away: "待定", winner: "" }
      ]
    },
    {
      name: "8 强",
      matches: [
        { id: "qf-01", label: "16 强胜者", home: "待定", away: "待定", winner: "" },
        { id: "qf-02", label: "16 强胜者", home: "待定", away: "待定", winner: "" }
      ]
    },
    {
      name: "半决赛",
      matches: [
        { id: "sf-01", label: "8 强胜者", home: "待定", away: "待定", winner: "" }
      ]
    },
    {
      name: "决赛",
      matches: [
        { id: "final", label: "冠军战", home: "待定", away: "待定", winner: "" }
      ]
    }
  ]
};

window.WORLD_CUP_STANDINGS = {
  updatedAt: "等待实时接口更新",
  source: "本地占位积分表",
  groups: [
    {
      name: "K 组",
      rows: [
        { rank: 1, team: "哥伦比亚", played: 1, win: 1, draw: 0, lose: 0, goalsFor: 1, goalsAgainst: 0, goalDiff: 1, points: 3 },
        { rank: 2, team: "葡萄牙", played: 1, win: 0, draw: 1, lose: 0, goalsFor: 1, goalsAgainst: 1, goalDiff: 0, points: 1 },
        { rank: 3, team: "刚果民主共和国", played: 1, win: 0, draw: 1, lose: 0, goalsFor: 1, goalsAgainst: 1, goalDiff: 0, points: 1 },
        { rank: 4, team: "乌兹别克斯坦", played: 1, win: 0, draw: 0, lose: 1, goalsFor: 0, goalsAgainst: 1, goalDiff: -1, points: 0 }
      ]
    },
    {
      name: "L 组",
      rows: [
        { rank: 1, team: "英格兰", played: 1, win: 1, draw: 0, lose: 0, goalsFor: 2, goalsAgainst: 1, goalDiff: 1, points: 3 },
        { rank: 2, team: "加纳", played: 1, win: 0, draw: 1, lose: 0, goalsFor: 1, goalsAgainst: 1, goalDiff: 0, points: 1 },
        { rank: 3, team: "巴拿马", played: 1, win: 0, draw: 1, lose: 0, goalsFor: 1, goalsAgainst: 1, goalDiff: 0, points: 1 },
        { rank: 4, team: "克罗地亚", played: 1, win: 0, draw: 0, lose: 1, goalsFor: 1, goalsAgainst: 2, goalDiff: -1, points: 0 }
      ]
    }
  ]
};

window.TEAM_PROFILES = {
  葡萄牙: {
    teamForm: 78,
    attack: 84,
    defense: 76,
    goalkeeper: 80,
    setPiece: 74,
    tournamentExperience: 86,
    recentExperience: "大赛经验深，但若进攻节奏过度依赖老将，阵地战容易变慢。",
    players: [
      { name: "Cristiano Ronaldo", role: "中锋", influence: 77, attack: 84, creation: 68, defense: 30, form: 70 },
      { name: "Bruno Fernandes", role: "前腰", influence: 88, attack: 80, creation: 90, defense: 58, form: 82 },
      { name: "Bernardo Silva", role: "中前场", influence: 84, attack: 76, creation: 88, defense: 62, form: 78 },
      { name: "João Neves", role: "中场", influence: 76, attack: 66, creation: 74, defense: 78, form: 80 },
      { name: "Diogo Costa", role: "门将", influence: 80, attack: 10, creation: 42, defense: 86, form: 78 }
    ]
  },
  刚果民主共和国: {
    teamForm: 72,
    attack: 73,
    defense: 75,
    goalkeeper: 78,
    setPiece: 80,
    tournamentExperience: 58,
    recentExperience: "世界杯经验少，但身体对抗、定位球和反击效率能放大爆冷概率。",
    players: [
      { name: "Yoane Wissa", role: "前锋", influence: 82, attack: 84, creation: 72, defense: 42, form: 86 },
      { name: "Cédric Bakambu", role: "前锋", influence: 78, attack: 80, creation: 66, defense: 38, form: 74 },
      { name: "Samuel Moutoussamy", role: "中场", influence: 74, attack: 58, creation: 70, defense: 76, form: 76 },
      { name: "Chancel Mbemba", role: "中卫", influence: 80, attack: 44, creation: 50, defense: 84, form: 78 },
      { name: "Lionel Mpasi", role: "门将", influence: 79, attack: 8, creation: 36, defense: 84, form: 82 }
    ]
  },
  英格兰: {
    teamForm: 86,
    attack: 88,
    defense: 74,
    goalkeeper: 76,
    setPiece: 82,
    tournamentExperience: 84,
    recentExperience: "前场火力强，能打出高比分；但防线波动会给对手留进球窗口。",
    players: [
      { name: "Harry Kane", role: "中锋", influence: 90, attack: 91, creation: 78, defense: 42, form: 88 },
      { name: "Jude Bellingham", role: "中场", influence: 90, attack: 84, creation: 86, defense: 72, form: 86 },
      { name: "Noni Madueke", role: "边锋", influence: 80, attack: 82, creation: 76, defense: 48, form: 82 },
      { name: "Declan Rice", role: "后腰", influence: 82, attack: 60, creation: 72, defense: 86, form: 80 },
      { name: "Jordan Pickford", role: "门将", influence: 75, attack: 8, creation: 38, defense: 78, form: 70 }
    ]
  },
  克罗地亚: {
    teamForm: 76,
    attack: 76,
    defense: 72,
    goalkeeper: 84,
    setPiece: 76,
    tournamentExperience: 90,
    recentExperience: "大赛经验极强，中场处理球稳定；但体能和防线速度会影响后段。",
    players: [
      { name: "Luka Modrić", role: "中场", influence: 86, attack: 66, creation: 88, defense: 58, form: 76 },
      { name: "Martin Baturina", role: "中场", influence: 78, attack: 74, creation: 80, defense: 54, form: 80 },
      { name: "Petar Musa", role: "前锋", influence: 76, attack: 80, creation: 58, defense: 36, form: 78 },
      { name: "Ivan Perišić", role: "边路", influence: 76, attack: 74, creation: 76, defense: 58, form: 72 },
      { name: "Dominik Livaković", role: "门将", influence: 86, attack: 8, creation: 38, defense: 90, form: 88 }
    ]
  },
  加纳: {
    teamForm: 70,
    attack: 72,
    defense: 70,
    goalkeeper: 68,
    setPiece: 76,
    tournamentExperience: 72,
    recentExperience: "身体强度和转换速度不错，但稳定性和防线细节需要折扣。",
    players: [
      { name: "Mohammed Kudus", role: "前场", influence: 84, attack: 84, creation: 80, defense: 50, form: 82 },
      { name: "Iñaki Williams", role: "前锋", influence: 78, attack: 80, creation: 64, defense: 40, form: 74 },
      { name: "Thomas Partey", role: "中场", influence: 78, attack: 64, creation: 72, defense: 78, form: 72 },
      { name: "Jordan Ayew", role: "前锋", influence: 72, attack: 72, creation: 68, defense: 48, form: 70 }
    ]
  },
  巴拿马: {
    teamForm: 66,
    attack: 66,
    defense: 68,
    goalkeeper: 66,
    setPiece: 72,
    tournamentExperience: 58,
    recentExperience: "杯赛经验较少，防守组织是底盘，进球更多依赖定位球或对手失误。",
    players: [
      { name: "Adalberto Carrasquilla", role: "中场", influence: 76, attack: 66, creation: 78, defense: 62, form: 74 },
      { name: "Michael Murillo", role: "边卫", influence: 72, attack: 62, creation: 66, defense: 72, form: 70 },
      { name: "José Fajardo", role: "前锋", influence: 68, attack: 72, creation: 54, defense: 36, form: 68 }
    ]
  },
  乌兹别克斯坦: {
    teamForm: 72,
    attack: 70,
    defense: 74,
    goalkeeper: 72,
    setPiece: 70,
    tournamentExperience: 52,
    recentExperience: "整体性强，首次世界杯阶段心理波动较大，但防守纪律能压低比分。",
    players: [
      { name: "Eldor Shomurodov", role: "前锋", influence: 78, attack: 80, creation: 62, defense: 40, form: 74 },
      { name: "Abbosbek Fayzullaev", role: "前场", influence: 76, attack: 72, creation: 78, defense: 48, form: 76 },
      { name: "Otabek Shukurov", role: "中场", influence: 70, attack: 58, creation: 66, defense: 72, form: 70 }
    ]
  },
  哥伦比亚: {
    teamForm: 82,
    attack: 82,
    defense: 76,
    goalkeeper: 74,
    setPiece: 80,
    tournamentExperience: 82,
    recentExperience: "南美对抗经验和个人能力强，适合在胶着局里用个人创造力破局。",
    players: [
      { name: "Luis Díaz", role: "边锋", influence: 88, attack: 88, creation: 80, defense: 50, form: 86 },
      { name: "James Rodríguez", role: "前腰", influence: 78, attack: 72, creation: 88, defense: 44, form: 74 },
      { name: "Jhon Arias", role: "中前场", influence: 78, attack: 76, creation: 78, defense: 58, form: 80 },
      { name: "Davinson Sánchez", role: "中卫", influence: 76, attack: 42, creation: 46, defense: 82, form: 76 }
    ]
  }
};
