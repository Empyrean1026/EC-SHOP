# Stripe 支付系统

第八阶段使用 Stripe PaymentIntents API 和 React Payment Element。浏览器只收集支付信息并调用 `confirmPayment`；订单是否付款成功只读取 MongoDB 中由签名 Webhook 写入的状态。

## 可信支付流程

1. 第七阶段根据服务端商品价格创建不可变订单快照。
2. 浏览器对 `POST /api/orders/:orderId/payment-intent` 发起带会话、Origin 与 CSRF Token 的请求。
3. 服务端限定 `_id + userId` 读取订单，只接受 `paymentMethod: stripe` 且未取消的订单。
4. 服务端使用订单的 `totalAmount`、`currency` 和配送快照创建 PaymentIntent，并将订单 ID、用户 ID 写入 Stripe metadata。
5. Stripe 请求使用固定订单级 Idempotency-Key；重试复用同一 PaymentIntent，MongoDB 的 `stripePaymentIntentId` 也有唯一索引。
6. 浏览器通过 Stripe Payment Element 安全收集支付信息并确认 PaymentIntent。
7. 浏览器返回后只轮询 `GET /api/orders/:orderId/payment-status`，不能提交“支付成功”。
8. `POST /api/webhooks/stripe` 使用原始请求体、`Stripe-Signature` 与独立 endpoint secret 验签。
9. Webhook 只有在 PaymentIntent ID、metadata 订单/用户、金额和币种与数据库订单全部一致时才转换状态。

## API

### `POST /api/orders/:orderId/payment-intent`

需要有效用户会话、匹配 Origin 和签名 CSRF Token。接口不接收金额、币种或商品信息，响应只包含当前订单支付会话所需的 `clientSecret`、Stripe 状态和数据库支付状态。已存在的 PaymentIntent 会被读取并验证，而不是重复创建。

### `GET /api/orders/:orderId/payment-status`

需要有效用户会话，并以 `_id + userId` 查询。响应来自 MongoDB，不使用浏览器 URL 中的 `payment_intent_client_secret` 判断成功。

### `POST /api/webhooks/stripe`

该接口不使用用户 Cookie 或 CSRF Token；Stripe 签名是请求身份凭据。请求体上限为 1 MiB，必须保留原始字节。处理事件：

- `payment_intent.processing` → `processing`
- `payment_intent.succeeded` 且 `amount_received === amount` → `paid`，待确认订单转为 `confirmed`
- `payment_intent.payment_failed` → `failed`，允许使用同一 PaymentIntent 重试
- `payment_intent.canceled` → `failed`

`paid` 不会被后到的失败或处理中事件回退；`partially_refunded` 和 `refunded` 也不属于可写支付状态。事件时间戳阻止较旧事件覆盖较新状态，重复事件通过条件更新保持幂等。

## 环境变量

```dotenv
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Secret key 与 Webhook secret 只能保留在服务端。Publishable key 会传给 Stripe.js，可以公开，但不能替代服务端鉴权。

本地开发可使用 Stripe CLI：

```bash
stripe login
stripe listen --events payment_intent.processing,payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled --forward-to localhost:3000/api/webhooks/stripe
```

把 CLI 输出的 `whsec_...` 写入 `.env.local` 后重启应用。生产环境应在 Stripe Workbench 创建 HTTPS Webhook endpoint，并分别配置生产密钥。

## 安全与业务边界

- PaymentIntent 金额和币种只来自订单快照，客户端无法覆盖。
- PaymentIntent 与用户、订单一对一绑定；现金订单和其他用户订单不能创建支付会话。
- 不记录或返回 secret key、Webhook secret、完整卡号或 CVC。
- 前端即时成功、返回 URL 和查询参数都不改变订单状态。
- 第八阶段不处理退款，也不声称支付状态更新等同于库存扣减。库存阶段需要实现预留、释放、超时取消、事务扣减和退款补偿。
