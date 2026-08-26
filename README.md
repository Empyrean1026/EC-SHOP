# EC Site

现代化全栈电商网站。项目采用单仓库 Next.js App Router 架构，页面与 Node.js Route Handlers 共享 TypeScript 类型和领域代码。

## 当前阶段

第五阶段“商品搜索”已完成，当前包含：

- Next.js 16、React 19、App Router 与严格模式 TypeScript
- Tailwind CSS 4 响应式基础布局
- MongoDB / Mongoose 连接复用与数据库健康检查接口
- User、Category、Product、Order、Cart 模型及嵌入式子文档
- 字段验证、JSON 安全序列化、关系索引与显式生产索引脚本
- 注册、登录、退出与当前用户 API
- bcrypt 密码哈希、JOSE JWT 与服务端 HttpOnly Cookie 会话
- Zod 严格输入验证、签名 CSRF 令牌、Origin 校验与请求体限制
- 用户中心、管理员后台、Next.js Proxy 和数据库级 RBAC
- 基础认证限流、统一安全错误响应与管理员角色维护脚本
- 商品列表、详情、分类导航、关键词搜索、组合过滤和稳定分页
- 价格、销量、评分排序与实时库存状态显示
- 公开商品/分类 REST API 和受管理员 RBAC + CSRF 保护的商品 CRUD
- 商品软删除、只读销量聚合字段与幂等目录种子脚本
- 独立搜索页、加权 MongoDB 全文索引、中文安全子串回退与相关度排序
- 250ms 防抖自动补全、过期请求取消、键盘操作与无结果状态
- 有候选上限的中英文模糊匹配与浏览器本地搜索历史
- 无需数据库连接的模型、认证、商品及搜索单元测试
- ESLint 9、Prettier 3 与 Tailwind 类名格式化
- 本地环境变量校验与安全的环境变量示例
- Next.js standalone Docker 镜像与 MongoDB Compose 服务
- 基础安全响应头、Git 仓库与项目目录约定

购物车操作、收藏夹、订单流程和 Stripe 支付等业务功能将在后续阶段实现。完整设计见 [`docs/database-design.md`](docs/database-design.md)、[`docs/authentication.md`](docs/authentication.md)、[`docs/product-system.md`](docs/product-system.md) 和 [`docs/search-system.md`](docs/search-system.md)。

## 技术要求

- Node.js 20.19 或更高版本，推荐 Node.js 22 LTS
- npm 10 或更高版本
- MongoDB 8，或可访问的 MongoDB Atlas 数据库
- Docker Desktop（仅 Docker 工作流需要）

## 本地开发

```bash
npm install
cp .env.example .env.local
npm run env:check
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。如果本机没有 MongoDB，可只浏览首页；数据库健康检查需要先启动 MongoDB。

## 环境变量

| 变量                 | 用途                              | 示例                                |
| -------------------- | --------------------------------- | ----------------------------------- |
| `MONGODB_URI`        | 服务端 MongoDB 连接字符串         | `mongodb://localhost:27017/ec_site` |
| `APP_URL`            | 服务端网站源站；用于 Origin 校验  | `http://localhost:3000`             |
| `AUTH_SECRET`        | JWT HMAC 密钥，至少 32 字节       | 使用随机值                          |
| `CSRF_SECRET`        | 独立 CSRF HMAC 密钥，至少 32 字节 | 使用另一份随机值                    |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost，允许 10–14           | `12`                                |

`.env.local` 已被 Git 忽略。不要在 `NEXT_PUBLIC_` 变量中放置密码、令牌或连接凭据。

## 常用命令

```bash
npm run dev           # 启动开发服务器
npm run build         # 创建生产构建
npm run start         # 启动生产服务器
npm run env:check     # 检查本地环境变量是否齐全
npm run lint          # 运行 ESLint
npm run typecheck     # 运行 TypeScript 类型检查
npm test              # 运行模型、认证与商品单元测试
npm run db:indexes    # 在目标 MongoDB 中创建声明的索引
npm run db:seed       # 幂等写入本地演示分类和商品
npm run user:role -- --email=user@example.com --role=admin
npm run format        # 自动格式化项目
npm run format:check  # 检查格式
npm run check         # 执行环境、格式、Lint、类型和测试检查
```

## Docker

同时启动应用与 MongoDB：

```bash
docker compose up --build
```

服务地址：

- 网站：[http://localhost:3000](http://localhost:3000)
- MongoDB：`mongodb://localhost:27017/ec_site`
- 健康检查：[http://localhost:3000/api/health](http://localhost:3000/api/health)

停止服务：

```bash
docker compose down
```

如需连同本地 MongoDB 数据卷一起清除，可显式运行 `docker compose down --volumes`。

## 目录结构

```text
ec-site/
├── app/                 # 页面、布局与 Route Handlers
│   └── api/health/      # MongoDB 健康检查 API
├── components/          # 可复用认证、商品与搜索 React 组件
├── docs/                # 数据库、认证、商品与搜索系统文档
├── hooks/               # 客户端 React Hooks
├── lib/                 # 数据库、认证、校验与 API 工具
├── middleware/          # 可复用请求中间件辅助代码
├── models/              # Mongoose 模型、子文档、枚举与验证器
├── public/              # 静态资源
├── scripts/             # 开发与运维脚本
├── services/            # 认证客户端与服务端商品/搜索领域服务
├── store/               # 全局客户端状态
├── tests/               # 自动化测试
├── types/               # 跨层 TypeScript 类型
├── .env.example         # 可提交的环境变量模板
├── .env.local           # 本地环境变量，不提交
├── Dockerfile           # 生产镜像
└── docker-compose.yml   # 应用与 MongoDB 编排
```

Next.js 16 将框架级请求拦截文件命名为根目录 `proxy.ts`；`middleware/` 目录仅存放未来可复用的中间件辅助函数。

## 认证入口

- 页面：`/register`、`/login`、`/account`、`/admin`
- 公共认证 API：`/api/auth/csrf`、`/api/auth/register`、`/api/auth/login`
- 会话 API：`/api/auth/logout`、`/api/auth/me`
- RBAC 示例 API：`/api/admin/ping`

公开注册永远创建 `customer`。如需本地管理员，注册后使用 `npm run user:role` 在可信终端提升角色，再重新登录。

## 商品入口

- 页面：`/products`、`/products/[id-or-slug]`
- 公开 API：`GET /api/products`、`GET /api/products/:id`、`GET /api/categories`
- 管理员 API：`POST /api/products`、`PUT /api/products/:id`、`DELETE /api/products/:id`

商品写操作需要管理员会话与 CSRF Token。删除采用下架软删除；详细查询参数和字段规则见 `docs/product-system.md`。

## 搜索入口

- 页面：`/search`
- 公开 API：`GET /api/search`、`GET /api/search/suggestions`

结果 API 支持全文、中文子串和有限模糊回退，并返回实际检索模式；搜索框提供防抖建议、请求取消、键盘导航和浏览器本地历史。部署前必须运行 `npm run db:indexes` 创建 `product_search` 索引，完整参数与扩展边界见 `docs/search-system.md`。

## GitHub

Git 已初始化，默认分支为 `main`。创建空的 GitHub 仓库后，可添加远程地址并推送：

```bash
git remote add origin git@github.com:<your-account>/ec-site.git
git push -u origin main
```

## API 响应约定

API 使用统一的判别联合：成功响应包含 `success: true` 与 `data`，失败响应包含 `success: false` 与安全的 `error.code`、`error.message`。服务端详细错误只写入日志，不返回内部连接信息。
