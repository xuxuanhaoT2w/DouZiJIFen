# 豆子局积分台：交付与部署手册

## 交付内容

此目录即为完整可交付源码，已包含：

- 前端、服务端 API、积分计算和历史场次逻辑；
- Cloudflare D1 数据库迁移：`drizzle/0000_initial_rooms.sql`；
- GitHub Actions 自动发布工作流：`.github/workflows/deploy-cloudflare.yml`；
- 本地环境变量模板：`.env.example`；
- 依赖锁定文件：`package-lock.json`。

压缩交付包不包含 `node_modules`、构建产物、历史临时压缩包和任何密钥。接收者解压后即可按以下步骤部署。

## 本地运行

前置条件：Node.js 22+、npm。

```bash
npm ci
Copy-Item .env.example .env.local
npm run dev
```

若不使用自动 PUBG 战绩拉取，可保持 `PUBG_API_KEY` 为空。启动后打开终端显示的本地地址。

验证生产构建：

```bash
npm run build
```

## Cloudflare + GitHub 部署（推荐）

### 1. 创建 Cloudflare 资源

1. 登录 Cloudflare，进入 **Workers & Pages**。
2. 若从未发布过 Worker，按引导注册一个唯一的 `workers.dev` 子域名。没有这一步，Worker 会在最后发布阶段失败。
3. 进入 **Workers & Pages → D1 SQL Database**，创建一个 D1 数据库并复制其 **Database ID**。

### 2. 配置 GitHub Secrets

在 GitHub 仓库进入 **Settings → Secrets and variables → Actions → Secrets**，添加：

| Secret | 用途 |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |
| `CLOUDFLARE_API_TOKEN` | 具备 Workers 编辑、D1 编辑权限的 API Token |
| `CLOUDFLARE_D1_DATABASE_ID` | 第 1 步创建的 D1 Database ID |
| `PUBG_API_KEY` | 可选。PUBG 官方开发者 API Key |

API Token 请仅授予当前账户范围内的 Workers 与 D1 所需最小权限，且只保存为 GitHub Secret；不要写入代码、README、前端页面或聊天记录。

### 3. 发布

将项目推送到 GitHub 的 `main` 分支。工作流会自动执行：安装依赖、构建、执行 D1 迁移、写入可选 PUBG API 密钥、发布 Worker。

也可进入 **Actions → Deploy to Cloudflare → Run workflow** 手动发布。成功后，日志会给出 `*.workers.dev` 访问地址；可在 Cloudflare 为 Worker 配置自定义域名。

## 数据与协作

- 房间状态保存在 Cloudflare D1；相同房间号的用户会读取同一份数据，并定时同步。
- PUBG API Key 可由部署者放入 Worker Secret，也可在页面中临时登记。页面临时登记的 Key 不写入历史战绩或浏览器存储。
- 部署前建议新建独立的 D1 数据库；不要将测试库和生产库混用。

## 更新与回滚

- 更新：合并或推送至 `main`，GitHub Actions 自动发布。
- 查看发布：GitHub **Actions** 中打开对应运行记录。
- 回滚：在 GitHub 将 `main` 回退到已验证的提交，然后重新运行 **Deploy to Cloudflare**。

## 常见问题

**发布提示需要注册 `workers.dev` 子域名**：前往 Cloudflare **Workers & Pages** 按引导注册一次，然后重跑工作流。

**提示 API Token 无效或权限不足**：重新创建 Token，并确认账户 ID、Token 与 D1 Database ID 都属于同一个 Cloudflare 账户。

**自动战绩拉取失败**：确认 PUBG API Key 有效，游戏平台选择正确，并确认查询起始时间覆盖目标对局。
