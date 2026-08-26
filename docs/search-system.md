# 商品搜索系统

第五阶段在第四阶段商品目录之上增加独立搜索页、全文检索、实时自动补全、拼写容错和浏览器本地历史。页面和 REST API 共用 `search-service.ts`，Server Component 不会通过 HTTP 请求自身 API。

## 页面与 API

| 方法  | 路径                      | 说明                                             |
| ----- | ------------------------- | ------------------------------------------------ |
| 页面  | `/search`                 | 搜索框、结果、分类/库存筛选、排序、分页和空状态  |
| `GET` | `/api/search`             | 商品全文、子串与有限模糊搜索                     |
| `GET` | `/api/search/suggestions` | 最多 10 条名称自动补全；不足时用有限模糊候选补齐 |

所有 API 都使用统一的 `success/data` 或 `success/error` 结构，并返回 `Cache-Control: no-store`。未知参数、过短关键词和越界分页会返回 `422 VALIDATION_ERROR`，内部数据库错误不会暴露给客户端。

## 搜索结果参数

`GET /api/search` 支持：

| 参数       | 默认值      | 规则                                             |
| ---------- | ----------- | ------------------------------------------------ |
| `q`        | 无          | 可选；有值时为 2–100 个字符                      |
| `category` | 无          | 有效分类 Slug 或 ObjectId                        |
| `page`     | `1`         | 从 1 开始，最大 100,000                          |
| `limit`    | `12`        | 每页 1–40 条                                     |
| `inStock`  | 无          | `true` 仅有库存，`false` 仅缺货                  |
| `fuzzy`    | `true`      | 前两种检索都无结果时是否启用有限模糊匹配         |
| `sort`     | `relevance` | `relevance`、`newest`、价格升降序或 `sales_desc` |

`GET /api/search/suggestions` 要求 `q` 为 2–50 个字符，`limit` 为 1–10，默认 8。

搜索响应的 `mode` 会明确表示实际路径：

- `full_text`：非 CJK 查询使用 `product_search` 文本索引。商品名权重 10、描述权重 2，相关度排序读取 MongoDB `textScore`。
- `substring`：CJK 查询或全文索引零结果时，使用长度受限且已转义的大小写不敏感子串匹配。
- `fuzzy`：前两种模式均零结果时，对最多 200 个候选商品的规范化名称和 Slug 计算有限编辑距离。
- `none`：未提交关键词或没有任何匹配。

例如：

```text
GET /api/search?q=studio+headphones&category=electronics&inStock=true&sort=relevance
GET /api/search/suggestions?q=headphnes&limit=8
```

## 自动补全与搜索历史

搜索框是带 ARIA `combobox/listbox` 语义的 Client Component：

- 输入至少两个字符后等待 250 ms 才请求建议；
- 每次输入变化都会中止尚未完成的旧请求，避免过期结果覆盖新结果；
- 支持 `ArrowUp`、`ArrowDown`、`Enter` 和 `Escape`；
- 网络或 API 失败时仍允许直接提交完整搜索；
- 最近 8 条搜索记录保存在 `localStorage` 的 `ec-search-history-v1` 中，可在下拉框清空；
- 历史不会进入 Cookie、MongoDB 或任何服务端日志字段。

浏览器禁用或耗尽本地存储时，搜索仍可正常使用，只是不保证历史持久化。

## 索引与扩展边界

Docker Compose 使用 MongoDB 8，基础部署通过标准文本索引工作：

```ts
productSchema.index(
  { name: "text", description: "text" },
  { weights: { name: 10, description: 2 }, name: "product_search" },
);
```

部署或修改索引后运行：

```bash
npm run db:indexes
```

子串正则与进程内编辑距离是适合当前阶段、小型目录的兼容回退，并非大规模搜索引擎。模糊候选固定为最多 200 条以限制 CPU 和内存，但这也意味着它不保证覆盖大型目录的所有长尾商品。

进入生产大目录后，应创建 MongoDB Search 索引，将 `$text`、正则自动补全和本地模糊评分替换为 `$search` 的 `text` / `autocomplete` 操作符，并保留现有 API 响应类型。MongoDB Search 可以原生提供 analyzer、autocomplete、fuzzy、highlight、synonym 和 facet；迁移时还应加入搜索分析、热门词集合与缓存/限流策略。
