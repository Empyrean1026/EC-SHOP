# 商品系统

第四阶段提供公开商品目录、商品详情、分类导航以及管理员商品 CRUD。页面和 Route Handlers 共享同一套 Zod 查询协议与服务层；Server Components 直接调用服务层，不通过 HTTP 请求自身 API。

## 页面

- `/products`：商品列表、搜索、分类、价格/库存过滤、排序和分页。
- `/products/[id]`：支持 MongoDB ObjectId 或商品 Slug 的详情页。
- 缺失或已下架商品返回 404 页面。

## REST API

| 方法     | 路径                | 权限         | 说明                                 |
| -------- | ------------------- | ------------ | ------------------------------------ |
| `GET`    | `/api/products`     | 公开         | 查询在售商品、筛选、排序和分页       |
| `GET`    | `/api/products/:id` | 公开         | 通过 ObjectId 或 Slug 获取在售商品   |
| `POST`   | `/api/products`     | admin + CSRF | 创建商品                             |
| `PUT`    | `/api/products/:id` | admin + CSRF | 更新一个或多个允许修改的商品字段     |
| `DELETE` | `/api/products/:id` | admin + CSRF | 软删除：下架商品并将库存归零         |
| `GET`    | `/api/categories`   | 公开         | 返回有效分类及每个分类的在售商品数量 |

所有响应继续使用统一的 `success/data` 或 `success/error` 判别结构。商品写入请求只接受 `application/json`，最大 64 KiB。

## 查询参数

`GET /api/products` 支持：

| 参数       | 默认值   | 规则                                                    |
| ---------- | -------- | ------------------------------------------------------- |
| `q`        | 无       | 名称或描述的安全、不区分大小写关键词匹配，最多 100 字符 |
| `category` | 无       | 分类 Slug 或 ObjectId                                   |
| `page`     | `1`      | 从 1 开始的页码                                         |
| `limit`    | `12`     | 每页 1–50 条                                            |
| `minPrice` | 无       | 最低价格，使用最小货币单位                              |
| `maxPrice` | 无       | 最高价格，必须不低于最低价格                            |
| `currency` | 无       | `jpy`、`usd` 或 `cny`                                   |
| `inStock`  | 无       | `true` 仅有库存，`false` 仅缺货                         |
| `sort`     | `newest` | 见下方排序值                                            |

排序值：

- `newest`：创建时间倒序。
- `price_asc` / `price_desc`：价格升序或降序。
- `sales_desc`：销量倒序。
- `rating_desc`：评分和评价数倒序。

所有排序最后都加入 `_id` 作为确定性条件，使 `skip/limit` 分页在相同数据快照内保持稳定。关键词会先进行正则字符转义并限制长度，兼容中文子串；数据量增大后应迁移到 MongoDB Search，并改用游标分页。

示例：

```text
GET /api/products?q=台灯&category=home-living&inStock=true&sort=price_asc&page=1&limit=12
```

## 商品写入字段

创建商品需要 `name`、`slug`、`description`、`price` 和 `categoryId`；`currency`、`images`、`stock` 与 `isActive` 有安全默认值或可显式设置。`PUT` 接受这些字段中的一个或多个。

商品图片支持 HTTP(S) URL 和以 `/` 开始的安全站内 `public` 资源路径。站内路径会拒绝 `..`、空路径段、反斜杠、查询参数和协议形式，订单商品快照使用同一规则。原创 SVG 使用 `next/image` 的 `unoptimized` 模式直接提供，避免开启全局 `dangerouslyAllowSVG`。

`rating`、`reviewCount` 和 `salesCount` 是系统聚合字段，不允许通过公开 CRUD 请求设置：评价阶段维护评分，订单支付完成后维护销量。价格始终使用最小货币单位，JPY 不缩放，USD/CNY 例如 `1299` 表示 12.99。

公开列表和详情只返回 `isActive: true` 的商品。`DELETE` 不物理删除记录，以免未来订单快照、购物车和审计引用失效；管理员可使用 `PUT` 将 `isActive` 恢复为 `true`。

## 管理员请求

商品写入同时要求：

1. 有效的 HttpOnly 会话 Cookie；
2. 数据库中当前用户角色为 `admin`；
3. `/api/auth/csrf` 返回的令牌 Cookie、`X-CSRF-Token` 请求头和可信 Origin 完全匹配。

请求体采用严格 Zod Schema，未知字段会被拒绝，因此不能伪造销量、评分或其他内部字段。重复 Slug 返回 `409 SLUG_ALREADY_EXISTS`，无效分类返回 `422 CATEGORY_NOT_FOUND`。

## 本地演示数据

以下命令会按 Slug 幂等写入 5 个分类和 18 个商品：

```bash
npm run db:seed
```

脚本会更新这些固定 Slug 的演示记录，不会删除其他商品。生产环境应使用受控的商品导入或管理员后台，不应运行演示种子。

其中 10 件带原创本地 SVG 主图的展示商品为：

| 商品             | 分类     |     价格 | 库存 |
| ---------------- | -------- | -------: | ---: |
| 真空不锈钢随行杯 | 户外出行 | JP¥3,480 |   36 |
| 柔光阅读台灯     | 家居生活 | JP¥5,980 |   18 |
| 六角包胶哑铃     | 运动健身 | JP¥4,500 |   20 |
| 缓冲瑜伽垫       | 运动健身 | JP¥3,980 |   28 |
| 双层保温饭盒     | 家居生活 | JP¥4,200 |   24 |
| 铝合金电脑支架   | 文具办公 | JP¥5,200 |   22 |
| 模块化桌面收纳盒 | 文具办公 | JP¥2,900 |   40 |
| 静音无线鼠标     | 数码设备 | JP¥3,600 |   32 |
| 折叠便携风扇     | 数码设备 | JP¥2,980 |   45 |
| 五级阻力带套装   | 运动健身 | JP¥2,600 |   50 |

主图保存在 `public/products/`。图像由项目内的几何路径和渐变构成，不包含品牌 Logo、商标、IP 角色、外部图片引用、脚本或 `foreignObject`。

Docker 环境重新导入时使用构建后的 `db-init` 镜像：

```bash
docker compose up -d --build
docker compose run --rm db-init npm run db:seed
```
