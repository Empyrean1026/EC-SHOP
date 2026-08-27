# Store

`cart-store.ts` creates the Zustand 5 vanilla store used by `CartProvider`. It owns derived totals, local cart operations, optimistic account state, safe guest persistence, and explicit client hydration.

Only guest items are written to `localStorage`; authenticated carts remain in MongoDB. Persisted browser data is treated as untrusted input and sanitized before use.
