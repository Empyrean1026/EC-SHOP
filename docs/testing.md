# 自动化测试

第十八阶段采用三层测试，既保留快速反馈，也覆盖真实 Route Handler、数据库与浏览器行为。

## 测试分层

| 层级          | 工具                        | 范围                                                                             |
| ------------- | --------------------------- | -------------------------------------------------------------------------------- |
| 单元测试      | Node.js `node:test` + `tsx` | 69 项模型、认证、安全、业务规则和配置测试                                        |
| 单元/集成测试 | Vitest                      | 注册/登录验证、商品查询、Zustand 购物车、结算、Stripe 与订单状态转换             |
| API / E2E     | Playwright                  | 真实 Next.js HTTP 服务、MongoDB、认证 Cookie、CSRF、购物车、结算、订单和页面交互 |

Playwright API 测试串联以下闭环：

1. 获取商品列表与详情。
2. 验证未认证的管理员写操作被拒绝。
3. 注册用户，验证错误密码失败和正确密码登录成功。
4. 加入购物车，并由服务端重新计算库存、数量与金额。
5. 创建货到付款订单，验证购物车被清空。
6. 从订单历史和详情读取同一订单。
7. 验证货到付款订单不能创建 Stripe PaymentIntent。
8. 验证伪造的 Stripe Webhook 签名被服务端拒绝。

浏览器测试覆盖注册、进入用户中心、退出和重新登录。Stripe 的成功付款闭环已在第八阶段用 test mode 实测；自动化套件不会连接真实 Checkout 或产生测试付款，而是持续验证服务端支付状态规则、订单绑定规则和 Webhook 签名边界。

## 首次准备

安装依赖和 Playwright Chromium：

```bash
npm install
npx playwright install chromium
```

E2E 测试需要一个可从宿主机访问的 MongoDB。默认连接：

```text
mongodb://127.0.0.1:27017/ec_site_e2e
```

可以在 `.env.local` 中设置 `E2E_MONGODB_URI`，但数据库名必须严格为 `ec_site_e2e`。测试启动前会删除并重建这个数据库，结束后再次删除；安全检查会拒绝任何其他数据库名。Docker Compose 的 MongoDB 未暴露宿主机端口，因此默认 E2E 流程使用本机 MongoDB 或单独的测试 MongoDB URI。

## 命令

```bash
npm test               # 69 项 node:test + 7 项 Vitest
npm run test:node      # 只运行既有 node:test
npm run test:vitest    # 只运行 Vitest
npm run test:coverage  # 生成 coverage/vitest HTML 覆盖率报告
npm run test:api       # 只运行真实 HTTP API 闭环
npm run test:e2e       # API 闭环 + Chromium 页面测试
npm run test:all       # 所有快速测试和 E2E 测试
```

Playwright 自动在 `127.0.0.1:3100` 启动 Next.js，测试完成后关闭服务。失败时，诊断资料保存在 `test-results/`；HTML 报告目录为 `playwright-report/`。这些输出和覆盖率报告均被 Git 忽略。

## 当前覆盖边界

- 支付成功的可信来源只能是验签后的 Stripe Webhook；自动化测试不会把浏览器返回页当作成功依据。
- 测试数据库为单 worker 串行运行，避免共享订单、库存和认证限流状态互相污染。
- Stripe SDK 的网络调用不进入常规 E2E，以保持测试确定性并避免外部服务造成误报；真实 test mode 支付仍按 `docs/payment-system.md` 的步骤做发布前验收。
- 后续 CI 可以直接运行 `npm run test:all`，并在失败时上传 `playwright-report/`、`test-results/` 和 `coverage/`。
