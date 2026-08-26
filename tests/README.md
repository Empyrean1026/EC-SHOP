# Tests

`models.test.ts` validates model defaults, normalization, custom validators, snapshots, serialization, and critical unique-index declarations without requiring a live database.

`auth.test.ts` validates Zod inputs, bcrypt password handling, JWT signatures and claims, signed CSRF tokens, and request-body constraints.

`products.test.ts` validates catalog query coercion, strict CRUD input, protected aggregate fields, DTO serialization, filter-preserving URLs, currency formatting, and inventory labels.

`search.test.ts` validates strict search inputs, filter-preserving URLs, text normalization, CJK detection, edit-distance typo matching, and the weighted MongoDB text-index declaration.

Run the suite with `npm test`.
