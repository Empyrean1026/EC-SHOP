# 用户认证与授权

第三阶段采用服务端会话边界：JWT 由 Route Handler 签发并保存在 HttpOnly Cookie 中，浏览器代码不读取或持久化 Token。所有受保护业务仍在服务端查询当前用户，JWT 中的角色只用于快速筛选，不作为最终授权依据。

## 请求流程

```text
浏览器 ── GET /api/auth/csrf ──> 签名 CSRF Cookie + 响应令牌
浏览器 ── POST + Origin + X-CSRF-Token + Cookie ──> Route Handler
                                                     │
                                                     ├─ CSRF / Origin 校验
                                                     ├─ IP 级基础限流
                                                     ├─ JSON 与 Zod 校验
                                                     ├─ bcrypt / MongoDB
                                                     └─ JWT HttpOnly Cookie

受保护页面 ──> proxy.ts 快速校验 JWT ──> DAL 查询数据库用户与实际角色
受保护 API  ──────────────────────────> authenticateRequest 查询数据库并授权
```

## API

| 方法 | 路径                 | 说明                                      |
| ---- | -------------------- | ----------------------------------------- |
| GET  | `/api/auth/csrf`     | 创建一小时有效的签名 CSRF 令牌            |
| POST | `/api/auth/register` | 注册 customer、写入 bcrypt 哈希并自动登录 |
| POST | `/api/auth/login`    | 校验凭据并创建七天会话                    |
| POST | `/api/auth/logout`   | 清除会话与 CSRF Cookie                    |
| GET  | `/api/auth/me`       | 返回已登录用户的安全字段                  |
| GET  | `/api/admin/ping`    | RBAC 示例，仅 admin 可访问                |

注册、登录与退出均先请求 `/api/auth/csrf`，再把响应中的 `csrfToken` 放入 `X-CSRF-Token` 请求头。`services/auth-client.ts` 已封装这一过程。

## 页面保护

- `/account`：必须登录。
- `/admin`：必须登录且数据库中的当前角色为 `admin`。
- `/forbidden`：已登录但权限不足时的落地页。
- 根目录 `proxy.ts` 只做无数据库的乐观检查；页面内 `requireUser()` 和 API 内 `authenticateRequest()` 才是授权边界。

公开注册固定创建 `customer`，请求体采用严格 Schema，不能注入 `role`。创建首个管理员时，先正常注册，然后在可信终端执行：

```bash
npm run user:role -- --email=admin@example.com --role=admin
```

角色改变后需重新登录，让快速筛选所用的 JWT 角色声明同步；服务端最终授权会立即采用数据库中的角色。

## 安全措施

| 风险             | 当前措施                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| 密码泄露         | bcrypt，默认 cost 12；密码只保存哈希；输入限制为 bcrypt 支持的 72 字节     |
| Token 被脚本读取 | 会话 Cookie 使用 `HttpOnly`、`SameSite=Lax`，生产环境开启 `Secure`         |
| CSRF             | HMAC 签名令牌、HttpOnly `SameSite=Strict` Cookie、请求头与严格 Origin 校验 |
| XSS              | React 默认转义；不使用 `dangerouslySetInnerHTML`；JWT 不暴露给客户端代码   |
| 参数注入         | Zod 严格对象、邮箱规范化、10 KiB JSON 上限、只接受 `application/json`      |
| 用户枚举/时序差  | 登录失败统一返回相同消息；用户不存在时仍执行一次 dummy bcrypt 校验         |
| 越权             | 注册角色硬编码；页面和 API 均根据数据库当前角色执行 RBAC                   |
| 暴力尝试         | 登录和注册分开进行 15 分钟最多 10 次的进程内 IP 限流                       |
| 信息泄露         | API 返回统一安全错误结构；内部异常仅写服务端日志                           |

现有响应头还包含 `X-Content-Type-Options`、`X-Frame-Options`、严格来源策略和受限浏览器权限。CSRF 防护不能替代 XSS 防护；若攻击者已经能在同源页面执行脚本，也能发起同源请求。

## 环境变量

`AUTH_SECRET` 与 `CSRF_SECRET` 必须不同，且各自至少 32 字节。可分别生成随机值：

```bash
openssl rand -base64 32
```

```dotenv
AUTH_SECRET=<第一份随机值>
CSRF_SECRET=<第二份随机值>
BCRYPT_SALT_ROUNDS=12
```

修改 `APP_URL` 时必须写完整源站地址，例如生产环境的 `https://shop.example.com`；CSRF Origin 校验依赖该服务端运行时变量。

## 生产环境后续项

当前限流存储在单个 Node.js 进程内，适合本地开发和单实例基础防护。多实例部署时应替换为 Redis 等共享存储，并只信任由入口代理覆盖的客户端 IP 头。高安全场景还应加入邮箱验证、密码重置、短会话或服务端撤销列表、登录审计、内容安全策略（CSP）和密钥轮换机制。
