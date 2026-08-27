# 订单系统

第九阶段为登录用户提供订单历史和订单详情。支付状态与订单/配送状态独立显示；读取接口只使用数据库中的当前用户身份限定订单归属。

## 页面

### `/account/orders`

- 默认按 `createdAt, _id` 倒序展示，保证相同时间下分页顺序稳定。
- 支持订单状态、支付状态、新旧排序和每页数量查询参数。
- 每张卡片展示订单号、创建时间、商品预览、商品种类/总件数、金额及两个状态。
- 无订单、无筛选结果和非法查询参数都有明确状态。

### `/account/orders/:orderId`

- 展示商品快照、总额、支付方式、支付状态、订单进度、收货地址和时间信息。
- 未付款或支付失败的 Stripe 订单可以返回原 PaymentIntent 支付页继续支付。
- 已取消订单不再展示继续支付入口。
- 查询始终使用 `_id + userId`；不存在或不属于当前用户的订单统一返回 404。

## API

### `GET /api/orders`

需要有效 HttpOnly Cookie 会话。查询参数：

- `page`：1–100000，默认 1。
- `limit`：1–50，默认 10。
- `status`：`pending`、`paid`、`processing`、`shipped`、`completed` 或 `cancelled`。
- `paymentStatus`：支付状态枚举。
- `sort`：`newest` 或 `oldest`。

未知字段和非法枚举返回 422，不会静默扩大查询范围。

### `GET /api/orders/:orderId`

返回当前用户的一张订单详情。响应不包含 `userId`、`stripePaymentIntentId`、Stripe 错误/事件字段、`checkoutKey` 或 `cartVersion`。

## 生命周期

订单状态：

1. `pending`：订单已创建，等待支付或商家处理。
2. `paid`：在线付款已由 Stripe Webhook 验证；货到付款订单不会自动进入此状态。
3. `processing`：商家正在备货处理。
4. `shipped`：商品已经发货。
5. `completed`：配送和订单履约完成。
6. `cancelled`：订单终止，不再继续履约。

支付状态仍独立使用 `pending`、`processing`、`paid`、`failed`、`partially_refunded` 和 `refunded`。例如订单可以处于 `shipped`，同时支付状态仍为 `paid`。

用户订单接口保持只读。第十一阶段新增受 RBAC、CSRF、合法状态转换表和并发条件保护的管理员履约接口；Stripe 支付状态仍由可信 Webhook 控制，只有货到付款完成时会同步记录已收款。

## 旧数据迁移

第八阶段曾使用 `confirmed` 和 `delivered`。读取层会分别映射为 `paid` 和 `completed`，因此迁移前用户仍可查看旧订单。部署新代码后运行：

```bash
npm run db:migrate-order-statuses
```

脚本只执行 `confirmed → paid` 与 `delivered → completed`，可重复运行。确认迁移后再由支付和履约服务写入新状态名称。

## 安全边界

- 列表过滤器始终附加当前用户 ID，客户端不能请求其他用户范围。
- 详情使用订单 ID 与当前用户 ID 组合查询，防止 IDOR。
- 列表 DTO 不返回收货地址；详情 DTO 返回订单配送快照，但不返回支付集成内部标识。
- 查询接口只读，不需要 CSRF Token；创建订单和支付会话仍使用原有 CSRF/Origin 防护。
- 订单状态不能由客户端查询参数、前端返回 URL 或 Stripe client secret 修改。
