# 实时数据接入说明

## 结论

当前网站已经具备实时数据接口入口：前端会请求 `/.netlify/functions/live-data`。

如果接口可用，使用实时赛程、球队、球员和晋级树数据；如果接口不可用，自动回退到 `data.js` 的本地样例数据。

## 为什么不能直接在前端接 API

足球数据 API 通常需要密钥。密钥如果写进 `index.html`、`app.js` 或 `data.js`，任何访问网站的人都能看到并盗用。

正确做法是：

1. 前端请求你自己的后端接口。
2. 后端接口读取环境变量里的 API key。
3. 后端去请求足球数据供应商。
4. 后端把清洗后的数据返回给前端。

## 推荐数据结构

实时接口返回：

```json
{
  "source": "provider-name",
  "updatedAt": "2026-06-18T12:00:00+08:00",
  "matches": [],
  "teams": {},
  "bracket": {}
}
```

## 过期赛程策略

- `status: "archived"` 或 `locked: true` 的比赛不再被实时接口覆盖。
- 未开赛和进行中的比赛可以更新。
- 完赛后应把比赛标记为 `archived`，用于历史复盘。

## 晋级树策略

`WORLD_CUP_BRACKET` 使用 rounds 结构：

- 32 强
- 16 强
- 8 强
- 半决赛
- 决赛

晋级球队确认后，把对应 match 的 `winner` 字段填入即可。

## 下一步

你需要选择一个足球数据供应商，并把 API key 配置到 Netlify 环境变量：

- 变量名：`FOOTBALL_API_KEY`
- 位置：Netlify Site settings -> Environment variables

如果使用 API-FOOTBALL，当前函数默认配置：

- `FOOTBALL_LEAGUE_ID=1`
- `FOOTBALL_SEASON=2026`
- `FOOTBALL_TIMEZONE=Asia/Shanghai`

其中只有 `FOOTBALL_API_KEY` 必填，其他三个可以先不填。

## Netlify 部署方式

不要继续只用 Netlify Drop。要使用后端函数，建议：

1. 把 `worldcup-yijing` 文件夹上传到 GitHub 仓库。
2. 在 Netlify 选择 Import from Git。
3. 发布目录设置为当前目录：`.`。
4. 函数目录会由 `netlify.toml` 自动指定为 `netlify/functions`。
5. 在 Netlify 环境变量里添加 `FOOTBALL_API_KEY`。
6. 重新 Deploy。
