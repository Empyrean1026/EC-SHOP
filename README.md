# EC Site

现代化全栈电商网站。项目采用单仓库 Next.js App Router 架构，页面与 Node.js Route Handlers 共享 TypeScript 类型和领域代码。

## 当前阶段

第十八阶段“测试”已完成，当前包含：

- Next.js 16、React 19、App Router 与严格模式 TypeScript
- Tailwind CSS 4 响应式基础布局
- MongoDB / Mongoose 连接复用与数据库健康检查接口
- User、Category、Product、Order、Cart、Wishlist 模型及嵌入式子文档
- 字段验证、JSON 安全序列化、关系索引与显式生产索引脚本
- 注册、登录、退出与当前用户 API
- bcrypt 密码哈希、JOSE JWT 与服务端 HttpOnly Cookie 会话
- Zod 严格输入验证、签名 CSRF 令牌、Origin 校验与请求体限制
- 用户中心、管理员 RBAC 基线、Next.js Proxy 和数据库级权限校验
- 基础认证限流、统一安全错误响应与管理员角色维护脚本
- 商品列表、详情、分类导航、关键词搜索、组合过滤和稳定分页
- 价格、销量、评分排序与实时库存状态显示
- 公开商品/分类 REST API 和受管理员 RBAC + CSRF 保护的商品 CRUD
- 商品软删除、只读销量聚合字段与幂等目录种子脚本
- 独立搜索页、加权 MongoDB 全文索引、中文安全子串回退与相关度排序
- 250ms 防抖自动补全、过期请求取消、键盘操作与无结果状态
- 有候选上限的中英文模糊匹配与浏览器本地搜索历史
- Zustand 5 全局购物车状态、SSR 安全的显式 hydration 与游客本地持久化
- 加入、删除、数量修改、库存限制、清空、小计与按币种分别汇总
- 登录用户 MongoDB 购物车、登录后安全合并与退出后的状态隔离
- 服务端实时价格和库存校验、单项 99 件及 100 种商品容量限制
- 受用户校验、Origin 与签名 CSRF Token 保护的账户购物车写接口
- React Hook Form + Zod 地址表单、商品/金额确认和支付方式选择
- 服务端可信价格生成订单快照、单币种限制与购物车版本并发校验
- UUID 请求幂等、同购物车防重复下单和条件清空购物车
- Stripe Payment Element、服务端 PaymentIntent 创建与订单级幂等复用
- 原始请求体 Webhook 验签、金额/币种/归属校验及幂等支付状态转换
- 支付失败重试、异步支付确认页面和所有者限定的支付状态查询
- 用户订单历史、订单详情、状态筛选、稳定分页和新旧排序
- Pending、Paid、Processing、Shipped、Completed、Cancelled 订单生命周期
- 独立支付状态与配送状态、响应式进度展示及旧状态兼容迁移
- 所有者限定的订单列表/详情 API 与安全订单 DTO
- 响应式用户仪表盘、账户子导航与订单/收藏数量摘要
- 个人姓名和 HTTP(S) 头像更新、只读身份字段与安全资料 DTO
- 默认收货地址的新增、修改、删除与结算预填复用
- 独立 Wishlist 模型、100 件容量限制和唯一商品约束
- 商品列表、详情及收藏页的幂等加入/移除交互
- 受用户校验、Origin、签名 CSRF Token 和严格 Zod 输入保护的账户写接口
- 管理员运营仪表盘、响应式后台导航与业务数量摘要
- 全量商品管理、上下架编辑、低库存筛选和聚焦库存更新
- 全量订单检索、订单详情和前进式履约状态机
- Stripe 未付款履约拦截、货到付款完成收款与并发更新保护
- 用户安全只读列表、角色/地址状态/订单数量查询
- 管理员专用读取 API 与 RBAC、Origin、CSRF 保护的写接口
- 管理员销售分析页、按币种分离的已确认销售额与数据更新时间
- 最近 30 天每日销售、最近 12 个月销售趋势与连续零值时间桶
- 基于已付款订单快照的热销商品销量排行、订单数和币种收入明细
- Recharts 响应式折线图与横向条形图、币种切换及无数据状态
- 管理员限定的数据统计 API 与明确的统计口径、时区和退款边界
- Mobile First 的 PC、Tablet、Mobile 三档响应式页面与移动导航
- 跟随系统且本地记忆的全站 Dark Mode、首屏无闪烁主题初始化
- 可访问的全局 Toast、原生 Dialog Modal 与安全的破坏性操作确认
- App Router 流式 Skeleton Loading、共享 Empty State 与可重试 Error Boundary
- 商品、购物车、收藏、账户和管理员写操作的成功、错误与进行中反馈
- 减少动态效果偏好、触控目标、焦点样式和深色表单控件适配
- 顶层 `success / message / code / details` 统一 API 错误协议
- 全局 Route Handler 异常包装器与领域错误集中映射
- 带 `requestId` 的安全 5xx 响应、响应头和单行 JSON 结构化日志
- 客户端成功、业务错误、无效 JSON、代理错误及网络中断统一解析
- 应用、账户、管理员及根布局四级可恢复 Error Boundary
- 不向客户端泄露异常消息、堆栈、数据库地址或服务端实现细节
- Next.js 原生 Helmet 等价安全头、每请求 nonce CSP 与 Stripe 安全域名白名单
- 默认拒绝跨站浏览器 API 的同源 CORS 策略与现有签名 CSRF 双重保护
- 全 API、搜索、Webhook 及认证分级限流和标准配额响应头
- JSON 对象键递归过滤、严格 Zod Schema、ObjectId 与排序白名单防 MongoDB Injection
- React 文本转义、HTTP(S) URL 限制和 CSP 组合防御 XSS
- JWT 固定算法与声明校验、HttpOnly/SameSite/Secure Cookie 和数据库角色复核
- bcrypt 10–14 cost、72 字节边界、dummy hash 时序防护和密码哈希默认隐藏
- `next/image` 响应式尺寸、视口懒加载、详情 LCP 图预加载与图片格式/缓存配置
- 公共目录、商品详情、分类、搜索和联想的限时数据缓存及写后精确失效
- Recharts 客户端动态分包、图表加载骨架和稳定派生数据 memoization
- 商品、订单和用户常用筛选路径的 MongoDB 组合索引与受限稳定 API 分页
- Next.js standalone 多阶段非 root 应用镜像与容器原生健康检查
- MongoDB 8 独立容器、命名数据卷、内部网络与零宿主机端口暴露
- 一次性数据库索引初始化容器和基于健康/成功状态的启动依赖
- 无需数据库连接的模型、认证、商品、搜索、购物车、结算、支付、订单、账户、管理员、统计、UI、错误处理、安全、性能及 Docker 单元测试
- Vitest 业务集成测试与 V8 HTML 覆盖率报告
- Playwright 真实 HTTP API 闭环、Chromium 注册/登录流程和失败追踪资料
- 独立 `ec_site_e2e` 数据库的运行前重建、安全数据库名校验与运行后清理
- 商品、认证、购物车、结算、Stripe 安全边界和订单历史的跨层自动化测试
- ESLint 9、Prettier 3 与 Tailwind 类名格式化
- 本地环境变量校验与安全的环境变量示例
- Next.js standalone Docker 镜像与 MongoDB Compose 服务
- 基础安全响应头、Git 仓库与项目目录约定

退款金额核算、库存预留和角色审计等业务能力将在后续阶段实现。完整设计见 [`docs/database-design.md`](docs/database-design.md)、[`docs/authentication.md`](docs/authentication.md)、[`docs/product-system.md`](docs/product-system.md)、[`docs/search-system.md`](docs/search-system.md)、[`docs/cart-system.md`](docs/cart-system.md)、[`docs/checkout-system.md`](docs/checkout-system.md)、[`docs/payment-system.md`](docs/payment-system.md)、[`docs/order-system.md`](docs/order-system.md)、[`docs/user-center.md`](docs/user-center.md)、[`docs/admin-panel.md`](docs/admin-panel.md)、[`docs/analytics.md`](docs/analytics.md)、[`docs/ui-ux.md`](docs/ui-ux.md)、[`docs/error-handling.md`](docs/error-handling.md)、[`docs/security.md`](docs/security.md)、[`docs/performance.md`](docs/performance.md)、[`docs/docker.md`](docs/docker.md) 和 [`docs/testing.md`](docs/testing.md)。

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

| 变量                                 | 用途                                | 示例                                |
| ------------------------------------ | ----------------------------------- | ----------------------------------- |
| `MONGODB_URI`                        | 服务端 MongoDB 连接字符串           | `mongodb://localhost:27017/ec_site` |
| `APP_URL`                            | 服务端网站源站；用于 Origin 校验    | `http://localhost:3000`             |
| `AUTH_SECRET`                        | JWT HMAC 密钥，至少 32 字节         | 使用随机值                          |
| `CSRF_SECRET`                        | 独立 CSRF HMAC 密钥，至少 32 字节   | 使用另一份随机值                    |
| `BCRYPT_SALT_ROUNDS`                 | bcrypt cost，允许 10–14             | `12`                                |
| `TRUST_PROXY`                        | 是否信任代理写入的客户端 IP Header  | `false`                             |
| `STRIPE_SECRET_KEY`                  | Stripe 服务端密钥，不得暴露给浏览器 | `sk_test_...`                       |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Elements 公开密钥            | `pk_test_...`                       |
| `STRIPE_WEBHOOK_SECRET`              | Webhook endpoint 签名密钥           | `whsec_...`                         |

`.env.local` 已被 Git 忽略。三项 Stripe 变量必须同时配置；未配置时其他本地功能仍可运行，但支付页会安全停用。不要在 `NEXT_PUBLIC_` 变量中放置密码、令牌或连接凭据，Stripe publishable key 是唯一例外且本身不是秘密。

## 常用命令

```bash
npm run dev           # 启动开发服务器
npm run build         # 创建生产构建
npm run start         # 启动生产服务器
npm run env:check     # 检查本地环境变量是否齐全
npm run lint          # 运行 ESLint
npm run typecheck     # 运行 TypeScript 类型检查
npm test              # 运行 node:test 与 Vitest 快速测试
npm run test:coverage # 运行 Vitest 并生成 V8 覆盖率报告
npm run test:api      # 运行 Playwright 真实 HTTP API 闭环
npm run test:e2e      # 运行 API 与 Chromium 页面测试
npm run test:all      # 运行全部快速测试和 E2E 测试
npm run db:indexes    # 在目标 MongoDB 中创建声明的索引
npm run db:migrate-order-statuses # 幂等迁移旧订单生命周期名称
npm run db:seed       # 幂等写入本地演示分类和商品
npm run user:role -- --email=user@example.com --role=admin
npm run format        # 自动格式化项目
npm run format:check  # 检查格式
npm run check         # 执行环境、格式、Lint、类型和测试检查
```

Playwright 首次使用前运行 `npx playwright install chromium`，并确保测试 MongoDB 可从宿主机访问。E2E 只允许清理名为 `ec_site_e2e` 的隔离数据库，详细准备、覆盖范围和 CI 建议见 [`docs/testing.md`](docs/testing.md)。

## Docker

首次启动会构建应用镜像、启动 MongoDB、创建索引并在依赖健康后启动网站：

```bash
docker compose up -d
```

服务地址：

- 网站：[http://localhost:3000](http://localhost:3000)
- MongoDB：仅供容器内部通过 `mongodb://mongodb:27017/ec_site` 访问
- 健康检查：[http://localhost:3000/api/health](http://localhost:3000/api/health)

查看完整状态（`db-init` 显示 `Exited (0)` 表示索引初始化成功）：

```bash
docker compose ps --all
```

停止服务：

```bash
docker compose down
```

如需连同本地 MongoDB 数据卷一起清除，可显式运行 `docker compose down --volumes`。
完整结构、日志、端口覆盖和生产安全边界见 [`docs/docker.md`](docs/docker.md)。

## 目录结构

```text
ec-site/
├── app/                 # 页面、布局与 Route Handlers
│   └── api/health/      # MongoDB 健康检查 API
├── components/          # 可复用认证、商品、购物车、结算、支付、订单与账户组件
├── docs/                # 数据库及各阶段业务系统文档
├── e2e/                 # Playwright API 与 Chromium 端到端测试
├── hooks/               # 购物车操作等客户端 React Hooks
├── lib/                 # 数据库、认证、购物车、结算、Stripe、订单、账户与 API 工具
├── middleware/          # 可复用请求中间件辅助代码
├── models/              # Mongoose 模型、子文档、枚举与验证器
├── public/              # 静态资源
├── scripts/             # 开发与运维脚本
├── services/            # 浏览器传输与服务端领域服务
├── store/               # Zustand 全局客户端状态
├── tests/               # 自动化测试
├── tests-vitest/        # Vitest 业务单元与集成测试
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

## 购物车入口

- 页面：`/cart`
- 账户 API：`GET /api/cart`、`DELETE /api/cart`、`POST /api/cart/items`、`PATCH|DELETE /api/cart/items/:productId`、`POST /api/cart/sync`
- 游客校验 API：`POST /api/cart/validate`

游客购物车保存在当前浏览器，登录或注册后会自动合并到 MongoDB 账户购物车。客户端快照不作为价格或库存依据，服务端每次响应都使用实时商品数据重新计算；完整规则见 `docs/cart-system.md`。

## 结算入口

- 页面：`/checkout`
- 创建订单 API：`POST /api/orders`
- 成功页面：`/checkout/success/:orderId`

结算仅对登录用户开放，支持地址填写与保存、商品和金额确认、Stripe/货到付款选择及幂等订单创建。Stripe 订单创建后进入独立支付页；完整安全与并发规则见 `docs/checkout-system.md`。

## Stripe 支付入口

- 支付页：`/checkout/payment/:orderId`
- 支付返回页：`/checkout/payment/return?orderId=:orderId`
- 创建/复用 PaymentIntent：`POST /api/orders/:orderId/payment-intent`
- 查询可信支付状态：`GET /api/orders/:orderId/payment-status`
- Stripe Webhook：`POST /api/webhooks/stripe`

浏览器的 `confirmPayment` 结果不会直接更新订单。只有使用 `STRIPE_WEBHOOK_SECRET` 验签成功，且 PaymentIntent 的 ID、订单 metadata、用户、金额和币种全部匹配时，Webhook 才能推进 `paymentStatus`。本地转发、测试事件和状态规则见 `docs/payment-system.md`。

## 订单入口

- 用户订单历史：`/account/orders`
- 用户订单详情：`/account/orders/:orderId`
- 订单列表 API：`GET /api/orders`
- 订单详情 API：`GET /api/orders/:orderId`

历史页面支持订单状态、支付状态、新旧排序和分页。列表与详情均通过当前数据库用户 ID 限定归属；响应不暴露 PaymentIntent、Webhook、结算幂等键或购物车版本等内部字段。用户接口保持只读，管理员履约写操作采用独立 RBAC 与状态机。完整规则见 `docs/order-system.md`。

## 用户中心入口

- 页面：`/account`、`/account/profile`、`/account/orders`、`/account/address`、`/account/wishlist`
- 资料 API：`GET|PATCH /api/account/profile`
- 地址 API：`GET|PUT|DELETE /api/account/address`
- 收藏 API：`GET /api/wishlist`、`POST /api/wishlist/items`、`DELETE /api/wishlist/items/:productId`

用户中心所有页面和数据均限定当前登录用户。邮箱与角色不可通过资料 API 修改；地址修改不会影响历史订单快照；收藏夹只返回当前仍在销售的商品。写接口均要求同源请求和签名 CSRF Token，完整边界见 `docs/user-center.md`。

## 管理员后台入口

- 页面：`/admin`、`/admin/analytics`、`/admin/products`、`/admin/products/new`、`/admin/products/:id/edit`、`/admin/orders`、`/admin/orders/:id`、`/admin/users`
- 读取 API：`GET /api/admin/dashboard`、`GET /api/admin/analytics`、`GET /api/admin/products`、`GET /api/admin/orders`、`GET /api/admin/users`
- 写入 API：`PATCH /api/admin/products/:id/stock`、`PATCH /api/admin/orders/:id`，以及原有商品 CRUD API

管理员页面和 API 都会重新查询数据库角色；销售数据只使用已确认付款订单并按币种独立汇总，商品删除采用软下架，订单履约禁止跳级、回退和未付款 Stripe 订单发货，用户列表不返回密码哈希或完整地址。完整规则见 `docs/admin-panel.md` 和 `docs/analytics.md`。

## GitHub

Git 已初始化，默认分支为 `main`。创建空的 GitHub 仓库后，可添加远程地址并推送：

```bash
git remote add origin git@github.com:<your-account>/ec-site.git
git push -u origin main
```

## API 响应约定

API 使用统一的判别联合：成功响应包含 `success: true` 与 `data`，失败响应包含 `success: false` 以及顶层的安全 `code`、`message`。服务端详细错误只写入日志，不返回内部连接信息。
