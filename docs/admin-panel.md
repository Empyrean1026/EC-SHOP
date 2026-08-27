# Admin panel

Phase eleven turns the RBAC foundation into an operations console for catalog, inventory, fulfillment, and user visibility.

## Pages

| Route                      | Capability                                  |
| -------------------------- | ------------------------------------------- |
| `/admin`                   | Product, inventory, order, and user summary |
| `/admin/products`          | Search/filter every active or inactive item |
| `/admin/products/new`      | Add a catalog product                       |
| `/admin/products/:id/edit` | Edit or reactivate a product                |
| `/admin/orders`            | Search and filter all customer orders       |
| `/admin/orders/:id`        | Inspect snapshots and advance fulfillment   |
| `/admin/users`             | Read-only customer/admin account list       |

The shared layout and every page call `requireUser("admin")`. The root Proxy performs an early JWT role check, while the data access layer independently reloads the current database role.

## APIs

| Method  | Route                           | Purpose                          |
| ------- | ------------------------------- | -------------------------------- |
| `GET`   | `/api/admin/dashboard`          | Dashboard summary                |
| `GET`   | `/api/admin/products`           | Include active/inactive products |
| `GET`   | `/api/admin/products/:id`       | Admin product detail             |
| `PATCH` | `/api/admin/products/:id/stock` | Focused inventory update         |
| `GET`   | `/api/admin/orders`             | All-order history                |
| `GET`   | `/api/admin/orders/:id`         | Admin order detail               |
| `PATCH` | `/api/admin/orders/:id`         | Fulfillment status update        |
| `GET`   | `/api/admin/users`              | Safe user summaries              |

Product create, full edit, and soft delete reuse `POST /api/products`, `PUT /api/products/:id`, and `DELETE /api/products/:id`. Every mutation requires a live admin role, trusted Origin, and signed CSRF token. All inputs use strict Zod schemas with body-size controls.

## Fulfillment state machine

- Stripe `pending` orders cannot enter processing before a verified Webhook marks payment paid; they may only be cancelled.
- Paid orders advance `paid → processing → shipped → completed` without skips or reversals.
- Cash-on-delivery orders advance `pending → processing → shipped → completed`, or may be cancelled while pending.
- Completing a cash-on-delivery order records `paymentStatus: paid` and `paidAt` because delivery completion represents cash collection.
- Completed and cancelled orders are terminal.

Updates use the current status and `updatedAt` in the database predicate to reject concurrent fulfillment changes. Admin APIs never expose Stripe intent IDs, Webhook guards, password hashes, or checkout idempotency fields. Stripe payment state remains Webhook-owned.

## Product deletion and users

Product deletion is a reversible business soft delete: it sets `isActive: false` and stock to zero. Existing order snapshots remain intact, and an administrator can edit the product to reactivate it.

User management is deliberately read-only in this phase. The list exposes safe identity fields, role, address presence, registration time, and order count. Password hashes and full addresses are not returned. Role changes continue to require the trusted terminal script until a later audited permissions workflow exists.
