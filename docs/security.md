# 安全设计

第十五阶段在认证、支付和统一错误处理基础上增加全站纵深防御。安全控制分布在浏览器响应头、Next.js Proxy、Route Handler、Zod 边界、领域服务和数据库查询中，任一单层都不被视为唯一防线。

## Helmet 等价实现

项目使用 Next.js App Router，不运行 Express，因此不直接安装 Helmet。`next.config.ts` 和 `proxy.ts` 提供对应能力：

- `Content-Security-Policy`：每次页面请求生成随机 nonce，限制脚本、iframe、表单、对象和外部连接；
- `X-Content-Type-Options: nosniff`；
- `X-Frame-Options: DENY` 与 CSP `frame-ancestors 'none'`；
- `Referrer-Policy: strict-origin-when-cross-origin`；
- `Permissions-Policy` 禁止相机、麦克风、定位与 Topics API；
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`，兼容支付弹窗；
- `Cross-Origin-Resource-Policy: same-origin`；
- `Origin-Agent-Cluster: ?1`；
- HTTPS 生产源站启用两年 HSTS；HTTP 本地与 Docker 开发不会写入 HSTS。

nonce CSP 会使页面采用动态渲染，以换取不依赖通用 `unsafe-inline` 脚本的 XSS 防护。开发环境仅为 React 调试加入 `unsafe-eval`；生产环境不包含该规则并启用 `upgrade-insecure-requests`。样式仍需 `unsafe-inline`，因为 Recharts 和现有响应式组件会生成 style 属性。

Stripe Payment Element 所需的 `js.stripe.com`、Stripe iframe、API、3D Secure hooks 和 Link 域名按 [Stripe Integration security guide](https://docs.stripe.com/security/guide#content-security-policy) 放行。不要为了排查支付问题改成 `default-src *`。

## CORS 与 CSRF

该网站是同源 BFF，不向第三方站点开放浏览器 API：

- 无 `Origin` 的服务端请求和 Stripe Webhook 可以进入下一层校验；
- 浏览器携带的 `Origin` 必须严格等于 `APP_URL` 的 origin；
- 外站请求返回 `403 CORS_ORIGIN_DENIED`，响应不包含 `Access-Control-Allow-Origin`；
- 所有账户和管理员写接口仍需要同源 Origin、签名 CSRF Cookie/Header 双提交和有效会话；
- CORS 不是认证机制，服务端仍执行 JWT、RBAC、资源所有权和 Webhook 签名验证。

## API 限流

Proxy 在 Route Handler 前执行通用限流：

| 范围              |    窗口 |   上限 |
| ----------------- | ------: | -----: |
| 普通 API          |   60 秒 | 120 次 |
| 搜索与建议        |   60 秒 |  60 次 |
| Stripe Webhook    |   60 秒 | 300 次 |
| 登录/注册附加限制 | 15 分钟 |  10 次 |

响应包含 `RateLimit-Limit`、`RateLimit-Remaining`、`RateLimit-Reset`；超限返回 429 和 `Retry-After`。客户端标识在内存中只保存 SHA-256 截断指纹，不保存 JWT 原文。

当前 Map 存储适合单实例和本地 Docker。多实例生产部署必须替换为 Redis、托管 KV 或 API Gateway 限流，并使用原子递增与 TTL。只有当可信反向代理会覆盖而非追加客户端 forwarding headers 时，才把 `TRUST_PROXY` 设为 `true`。

## 输入验证与 MongoDB Injection

- JSON 请求限定 `Content-Type` 和字节数；
- JSON 解析后递归拒绝以 `$` 开头、包含 `.`、`__proto__`、`prototype` 或 `constructor` 的对象键；
- 所有 Route Handler 使用严格 Zod Object，拒绝未知字段、错误类型和越界数字；
- MongoDB ObjectId 必须匹配 24 位十六进制格式；
- 列表查询仅从枚举白名单选择排序和过滤方式；
- 用户搜索内容在进入正则表达式前统一转义；
- 服务端重新计算价格、库存、订单总额和支付归属，不信任浏览器快照。

## XSS

- 用户文本由 React 作为文本节点渲染，默认进行 HTML 转义；
- 业务数据不使用 `dangerouslySetInnerHTML`；唯一内联主题脚本是代码仓库中的静态常量并带每请求 nonce；
- 图片和头像 URL 只接受 HTTP(S)，拒绝 `javascript:`、`data:` 等脚本协议；
- CSP 禁止 object、外部 form action、第三方 frame 和未授权脚本；
- 错误响应不返回堆栈、数据库连接串或服务端异常详情。

## JWT、Cookie 与密码

- JWT 固定 `HS256`，验证 issuer、audience、subject、role、expiry 和允许算法；
- Token 包含随机 JTI，默认七天过期，使用至少 32 字节 `AUTH_SECRET`；
- 会话仅保存在 `HttpOnly`、`SameSite=Lax` Cookie，生产环境启用 Secure；
- CSRF Cookie 使用 `HttpOnly`、`SameSite=Strict` 和独立的 32 字节密钥；
- bcrypt cost 只允许 10–14，默认 12；密码 UTF-8 长度不超过 bcrypt 的 72 字节边界；
- 登录不存在的账户时仍执行固定 dummy bcrypt compare，降低用户枚举和时序差异；
- 数据库默认不返回 `passwordHash`，只有登录校验显式选择该字段。

## 权限校验

- Proxy 只做页面导航的乐观检查；
- Server Components 通过 DAL 重新读取数据库用户；
- API 每次验证 JWT，并重新读取数据库角色，避免仅信任旧 Token 内角色；
- 管理员写操作要求数据库管理员角色、同源请求和 CSRF；
- 订单、支付、购物车、地址和收藏查询都限定当前用户 ID；
- Stripe Webhook 需要原始请求体验签，并再次比对 PaymentIntent、用户、订单、金额与币种。

## 生产检查清单

1. 使用 HTTPS，将 `APP_URL` 设置为最终公开源站。
2. 使用独立随机值配置 `AUTH_SECRET` 与 `CSRF_SECRET`，不要复用 Stripe 密钥。
3. 在可信代理后正确配置 `TRUST_PROXY`，否则保持 `false`。
4. 把内存限流迁移到共享原子存储，并设置告警。
5. 将结构化日志接入集中平台并清洗 Cookie、JWT、地址和支付信息。
6. 定期轮换密钥、更新 npm 依赖并执行依赖漏洞扫描。
7. 对 CSP 违规使用 Report-Only 预演后再收紧域名，不要直接加入通配 `*`。
