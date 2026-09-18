# 豆子局积分台

用于多人记录 PUBG 对局战绩、伤害尾数分组、积分结算与场次历史查询的 Web 应用。

## 功能

- 自动拉取或手动录入对局数据
- 按伤害尾数分组、零和结算与累计排行
- 场次归档、逐局明细与多人房间同步
- PUBG API Key 临时登记与战绩查询

## 开发

```bash
npm install
npm run build
```

## 自动部署到 Cloudflare

GitHub 已配置推送 `main` 自动发布工作流。首次使用时，在 Cloudflare 创建一个 D1 数据库，并在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 设置以下 Secrets：

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_D1_DATABASE_ID`
- `PUBG_API_KEY`（可选）

设置完成后，重新推送一次 `main` 或在 GitHub Actions 手动运行 **Deploy to Cloudflare**。
