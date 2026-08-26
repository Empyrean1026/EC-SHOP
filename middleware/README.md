# Middleware

Reusable request middleware helpers live here. Next.js request interception itself uses a root-level `proxy.ts` in Next.js 16.

Authentication helpers are grouped under `lib/auth/`. The Proxy only performs an optimistic JWT check; protected pages and APIs must also use the database-backed authorization helpers in `lib/auth/dal.ts`.
