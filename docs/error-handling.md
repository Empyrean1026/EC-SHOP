# 错误处理

第十四阶段将预期业务错误、输入错误和意外异常分开处理。预期错误作为明确的 API 返回值；未捕获异常由统一处理器转换为安全响应，并通过请求编号关联服务端日志。

## API 协议

成功响应保持以下结构：

```json
{
  "success": true,
  "data": {}
}
```

所有失败响应使用顶层字段，不再嵌套 `error`：

```json
{
  "success": false,
  "message": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

`message` 用于用户界面，`code` 是供客户端流程判断的稳定机器码。Zod 字段错误可附加 `details`；意外服务端异常会附加 `requestId`，并同时写入 `X-Request-Id` 响应头。

```json
{
  "success": false,
  "message": "服务暂时不可用，请稍后重试。",
  "code": "INTERNAL_ERROR",
  "requestId": "63e0dba5-4665-47e0-8878-dce70686db80"
}
```

## 服务端处理

- `apiError()` 返回验证、认证、权限、未找到和冲突等预期错误。
- `apiInternalError()` 记录未知异常并返回安全文案，响应中不包含异常消息或堆栈。
- `withApiErrorHandling()` 是 Route Handler 的全局异常包装器，适合没有领域错误映射的接口。
- 购物车、结算、支付、账户和管理员模块先映射已知领域异常，再把未知异常交给统一处理器。
- 错误响应统一使用 `Cache-Control: no-store, max-age=0`，避免缓存个性化或暂时性错误。

结构化服务端日志为单行 JSON，包含 `level`、`timestamp`、`requestId`、`context`、错误类型、消息和堆栈。日志不得主动加入密码、Cookie、JWT、Stripe 密钥、完整请求体或其他凭据。

## 客户端处理

`parseApiResponse()` 统一解析 API 响应，并覆盖以下情况：

- HTTP 成功且响应符合成功协议；
- API 返回稳定错误码、字段详情和请求编号；
- 反向代理或上游返回 HTML、纯文本或无效 JSON；
- HTTP 状态与响应体状态不一致；
- fetch、CSRF 初始化或网络连接失败。

事件处理器在本地捕获请求错误，并通过表单提示或 Toast 展示；渲染阶段异常则交给 Error Boundary。

## Error Boundary

- `app/error.tsx` 处理普通应用路由的意外渲染错误。
- `app/account/error.tsx` 与 `app/admin/error.tsx` 提供分区恢复界面。
- `app/global-error.tsx` 覆盖根布局失败，并独立声明 `html`、`body`、样式和系统深色模式。
- 页面只显示 Next.js `digest` 供排查，不显示生产环境内部异常详情。

## 状态码

| 状态码 | 用途                                |
| ------ | ----------------------------------- |
| `400`  | 请求格式或标识不合法                |
| `401`  | 未登录或会话失效                    |
| `403`  | 权限、Origin 或 CSRF 校验失败       |
| `404`  | 资源不存在                          |
| `409`  | 库存、状态机、幂等或并发冲突        |
| `413`  | 请求体超过限制                      |
| `415`  | Content-Type 不受支持               |
| `422`  | Zod 字段验证失败                    |
| `429`  | 请求频率过高                        |
| `500`  | 未知服务端异常                      |
| `503`  | 数据库、Stripe 配置或依赖暂时不可用 |

## 生产扩展

当前日志写入标准错误流，适用于 Docker 日志采集。接入 Sentry、OpenTelemetry 或云日志平台时，应保留 `requestId` 和 `context` 字段，并在发送前配置敏感字段清洗、采样、告警阈值与数据保留策略。
