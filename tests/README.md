# Tests

`models.test.ts` validates model defaults, normalization, custom validators, snapshots, serialization, and critical unique-index declarations without requiring a live database.

`auth.test.ts` validates Zod inputs, bcrypt password handling, JWT signatures and claims, signed CSRF tokens, and request-body constraints.

`products.test.ts` validates catalog query coercion, strict CRUD input, protected aggregate fields, DTO serialization, filter-preserving URLs, currency formatting, and inventory labels.

`search.test.ts` validates strict search inputs, filter-preserving URLs, text normalization, CJK detection, edit-distance typo matching, and the weighted MongoDB text-index declaration.

`cart.test.ts` validates strict cart inputs, hostile persistence cleanup, stock and quantity limits, derived totals, currency separation, and product snapshot conversion.

`checkout.test.ts` validates nested address inputs, explicit confirmation, tamper rejection, cart snapshot comparison, order DTO boundaries, and nested API error paths.

`payment.test.ts` validates raw-body Stripe signature verification, PaymentIntent-to-order integrity binding, supported Webhook transitions, exact amount receipt, and failure handling.

`orders.test.ts` validates history query controls, the public lifecycle, legacy status normalization, safe list/detail DTOs, and filter-preserving pagination URLs.

Run the suite with `npm test`.
