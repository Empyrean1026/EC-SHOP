# Tests

`models.test.ts` validates model defaults, normalization, custom validators, snapshots, serialization, and critical unique-index declarations without requiring a live database.

`auth.test.ts` validates Zod inputs, bcrypt password handling, JWT signatures and claims, signed CSRF tokens, and request-body constraints.

Run the suite with `npm test`.
