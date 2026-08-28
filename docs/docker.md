# Docker 部署

## 服务结构

当前项目使用 Next.js 全栈架构，因此页面前端和 Node.js API 后端由同一个 `app` 容器提供，MongoDB 独立运行：

```text
Browser
   │ :3000
   ▼
app (Next.js UI + Route Handlers)
   │ internal database network
   ▼
mongodb (MongoDB 8 + named volume)
```

`db-init` 是一次性初始化容器。它会等 MongoDB 健康后执行 `npm run db:indexes`，成功退出后 `app` 才开始运行。看到 `db-init` 状态为 `Exited (0)` 属于正常行为。

## 一键启动

先确认 Docker Desktop 已启动且项目根目录存在有效的 `.env.local`，然后运行：

```bash
docker compose up -d
```

首次启动会自动构建多阶段镜像、拉取 MongoDB 8、创建数据卷、创建索引并启动网站。检查状态：

```bash
docker compose ps --all
curl --fail http://localhost:3000/api/health
```

网站地址为 <http://localhost:3000>。MongoDB 不发布宿主机端口，容器间仅通过不可从外部访问的 `database` 网络通信，因此不会与本机已有的 MongoDB 冲突。

## 常用操作

```bash
docker compose logs -f app       # 查看应用日志
docker compose logs db-init      # 查看索引初始化结果
docker compose restart app       # 重启应用
docker compose down              # 停止并删除容器，保留数据库数据
docker compose down --volumes    # 同时删除 MongoDB 数据卷（不可恢复）
```

如需重新构建最新代码：

```bash
docker compose up -d --build
```

如需写入演示目录数据：

```bash
docker compose run --rm db-init npm run db:seed
```

可通过 Shell 环境变量更改宿主机端口：

```bash
APP_PORT=3100 DOCKER_APP_URL=http://localhost:3100 docker compose up -d
```

## 数据与安全边界

- `mongodb_data` 命名卷在普通 `docker compose down` 后仍会保留。
- `.env.local` 仅在运行时注入，不复制进镜像，也不提交 Git。
- 应用镜像使用 Next.js standalone 输出，并以无特权 `nextjs` 用户运行。
- `app` 同时连接外部网络和内部数据库网络；MongoDB 只连接内部数据库网络。
- 当前 Compose 面向单机开发/验收。公网生产环境应在应用前增加 TLS 反向代理，并为 MongoDB 配置独立凭据或使用托管数据库。
- 单容器部署可使用本地 Next.js 数据缓存；扩展到多个应用副本前，需要引入共享缓存与跨实例标签失效。

Stripe Webhook 本地测试仍需在宿主机运行 Stripe CLI，并转发到 `http://localhost:3000/api/webhooks/stripe`。

如需从宿主机使用 `mongosh` 调试容器数据库，请使用 `docker compose exec mongodb mongosh ec_site`，无需开放数据库端口。
