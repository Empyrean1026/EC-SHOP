# Models

Mongoose schemas, embedded subdocuments, shared enums, validators, and serialization rules live here.

| Model           | Collection   | Responsibility                                              |
| --------------- | ------------ | ----------------------------------------------------------- |
| `UserModel`     | `users`      | Identity, role, avatar, and default address                 |
| `CategoryModel` | `categories` | Hierarchical product taxonomy                               |
| `ProductModel`  | `products`   | Catalog content, price, stock, sales, and rating aggregates |
| `OrderModel`    | `orders`     | Checkout snapshots, idempotency, payment and fulfillment    |
| `CartModel`     | `carts`      | One active cart per user with unique product lines          |

Import models through the barrel module:

```ts
import { ProductModel, type Product } from "@/models";
```

Model modules are server-only infrastructure and must not be imported into Client Components. See `docs/database-design.md` for relationships, field conventions, indexes, and service-layer invariants.
