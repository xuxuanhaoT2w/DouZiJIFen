# 豆子局积分台

可多人同步使用的 PUBG 对局积分台：支持手动记分、官方 API 自动拉取、伤害尾数分组、零和结算、场次归档及逐局明细。

## 交付与快速开始

本仓库可直接作为交付项目使用；完整交接、部署和安全配置请看 [DELIVERY.md](./DELIVERY.md)。

本地运行需要 Node.js 22 或更高版本：

```bash
npm ci
npm run dev
```

构建验证：

```bash
npm run build
```

如需在本地配置 PUBG 官方 API Key，请从 `.env.example` 复制为 `.env.local` 后填写。真实密钥绝不能提交到 Git 仓库。

## Cloudflare 自动部署

仓库已包含 GitHub Actions 工作流：推送到 `main` 会构建、迁移 D1 并发布 Worker。首次部署前需：

1. 在 Cloudflare Workers 中注册一个 `workers.dev` 子域名；
2. 创建 D1 数据库；
3. 在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 配置：
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_D1_DATABASE_ID`
   - `PUBG_API_KEY`（可选；也可由用户在页面临时登记）
4. 推送 `main`，或在 GitHub Actions 中手动运行 **Deploy to Cloudflare**。
