# Services

Domain services and external integrations live here. Keep transport details out of UI components.

`auth-client.ts` is the browser-side authentication transport. It obtains a signed CSRF token before every state-changing authentication request and never accesses the HttpOnly session cookie.

`product-service.ts` is server-only and owns catalog queries, deterministic pagination, category resolution, product mutations, and DTO serialization. Server Components call it directly; public clients use the matching Route Handlers.

`search-service.ts` is server-only and owns weighted text search, safe substring fallback, bounded fuzzy matching, autocomplete candidates, and search-mode reporting. The `/search` Server Component calls it directly while browser suggestions use the public Route Handler.

`cart-service.ts` is server-only and owns live product resolution, inventory limits, account persistence, guest validation, login merging, adjustments, and currency-separated totals.

`cart-client.ts` is the browser transport for cart synchronization. It requests signed CSRF tokens before account mutations and uses the public validation endpoint to refresh untrusted guest snapshots.

`csrf-client.ts` centralizes acquisition of signed CSRF tokens for browser-side mutation transports.

`checkout-service.ts` is server-only and owns checkout page data, authoritative order snapshots, cart confirmation checks, idempotent creation, conditional cart clearing, and owner-scoped order reads.

`checkout-client.ts` submits the validated checkout form and the user's expected cart snapshot to the protected order endpoint.

`payment-service.ts` owns server-side PaymentIntent creation/reuse, order binding, Webhook integrity checks, stale-event guards, and payment/order status transitions. It never accepts client-calculated amounts.

`payment-client.ts` requests a CSRF-protected payment session and polls the owner-scoped database status after Stripe confirmation; it has no API that can mark an order paid.

`order-service.ts` owns user-scoped order history and detail queries, filtering, deterministic pagination, safe DTO conversion, and legacy lifecycle compatibility. It exposes no user-controlled fulfillment mutation.

`account-service.ts` owns safe profile, default-address, and dashboard reads/writes. `wishlist-service.ts` owns active-product resolution, idempotent add/remove behavior, and the 100-item limit. `account-client.ts` attaches signed CSRF tokens to browser mutations.

`admin-service.ts` owns operational summaries, all-product queries, all-order fulfillment, safe user lists, and concurrent status guards. `admin-client.ts` carries signed CSRF tokens for catalog, inventory, and order mutations.
