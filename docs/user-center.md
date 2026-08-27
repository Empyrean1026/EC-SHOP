# User center

Phase ten provides one authenticated home for customer identity, order history, the default checkout address, and saved products. Administrator operations remain isolated under `/admin` for the next phase.

## Pages

| Route               | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `/account`          | Dashboard counts and shortcuts                            |
| `/account/profile`  | Edit name and optional HTTP(S) avatar; email is read-only |
| `/account/orders`   | Existing owner-scoped order history                       |
| `/account/address`  | Create, update, or delete one default checkout address    |
| `/account/wishlist` | View active saved products and remove or purchase them    |

The shared account layout supplies responsive navigation. All pages require a valid JWT session and re-check the current user in MongoDB through the data access layer.

## APIs

| Method   | Route                            | Behavior                     |
| -------- | -------------------------------- | ---------------------------- |
| `GET`    | `/api/account/profile`           | Return safe profile DTO      |
| `PATCH`  | `/api/account/profile`           | Update name and avatar       |
| `GET`    | `/api/account/address`           | Return default address       |
| `PUT`    | `/api/account/address`           | Replace default address      |
| `DELETE` | `/api/account/address`           | Remove default address       |
| `GET`    | `/api/wishlist`                  | Return active saved products |
| `POST`   | `/api/wishlist/items`            | Idempotently save a product  |
| `DELETE` | `/api/wishlist/items/:productId` | Idempotently remove product  |

All mutations require the authenticated user, a trusted same-origin request, and a valid signed CSRF token. JSON bodies have explicit size limits and strict Zod schemas reject unknown fields. The browser can never supply a target user ID or change email and role through these endpoints.

## Data rules

- The existing embedded user `address` stores one default address. Checkout copies it into an immutable order snapshot, so later edits do not rewrite history.
- A separate `wishlists` collection has one document per user and up to 100 unique product references.
- Only active products are returned by wishlist reads. Product prices and stock always come from the current catalog document.
- Adding the same product or removing a missing product is idempotent.
- Avatar URLs accept only `http` and `https`; no HTML is rendered from profile inputs.

Run `npm run db:indexes` after deployment to create the wishlist user uniqueness index. Multiple named addresses, email-change verification, password change, account deletion, and administrator user management are intentionally deferred.
