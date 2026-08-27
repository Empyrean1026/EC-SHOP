# Sales analytics

Phase twelve adds a source-backed sales dashboard to the administrator console.

## Entry points

| Route                  | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `/admin/analytics`     | Responsive KPI, trend, and top-product dashboard   |
| `/api/admin/analytics` | Admin-only JSON snapshot of the dashboard measures |

Both routes require a current database user with the `admin` role. The page is rendered dynamically, and the API uses the existing authenticated error envelope.

## Metric definitions

| Metric              | Definition                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| Confirmed revenue   | Sum of `Order.totalAmount` where `paymentStatus = paid`, grouped by order currency                 |
| Total orders        | Count of every order, including unpaid, failed, refunded, and cancelled orders                     |
| Paid orders         | Count of orders where `paymentStatus = paid`                                                       |
| Users               | Count of every user document                                                                       |
| Products            | Count of every product document; active product count is shown as context                          |
| Daily sales         | Confirmed revenue grouped by `paidAt` calendar day for the latest 30 days                          |
| Monthly sales       | Confirmed revenue grouped by `paidAt` calendar month for the latest 12 months                      |
| Top-selling product | Sum of paid order-item quantity by product snapshot; ranking is by units, with order count context |

Money remains in the integer minor-unit representation used throughout the application. JPY has no fractional conversion; USD and CNY are divided by 100 only when formatted. Currency totals and trends are never added together or converted with an unstored exchange rate.

## Source and time rules

- MongoDB `orders`, `users`, and `products` collections are the sources of truth.
- Stripe sales become visible only after a verified Webhook changes the order to `paid` and records `paidAt`.
- Cash-on-delivery sales become visible when an administrator completes the order, which records the same paid fields.
- Daily and monthly buckets use `Asia/Tokyo`; empty periods are explicitly returned as zero so the timeline remains continuous.
- Fully refunded and partially refunded orders are excluded because their status is no longer `paid`. Net partial-refund analytics requires a stored refunded amount in a later phase.
- Top products use immutable order-item snapshots so historical sales survive product edits or deactivation.

## Chart map

| Question                                        | Visual                      | Encoding                                     |
| ----------------------------------------------- | --------------------------- | -------------------------------------------- |
| How is confirmed revenue moving day to day?     | 30-point line chart         | X = paid day, Y = selected-currency amount   |
| How is confirmed revenue moving month to month? | 12-point line chart         | X = paid month, Y = selected-currency amount |
| Which products sold the most units?             | Horizontal ranked bar chart | Y = product, X = paid units                  |

The JPY/USD/CNY selector changes amount displays only. Product ranking stays quantity-based so products from different currencies can be compared without mixing money. Exact top-product units, distinct order counts, and selected-currency revenue are also exposed in a table.
