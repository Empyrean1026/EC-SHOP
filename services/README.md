# Services

Domain services and external integrations live here. Keep transport details out of UI components.

`auth-client.ts` is the browser-side authentication transport. It obtains a signed CSRF token before every state-changing authentication request and never accesses the HttpOnly session cookie.

`product-service.ts` is server-only and owns catalog queries, deterministic pagination, category resolution, product mutations, and DTO serialization. Server Components call it directly; public clients use the matching Route Handlers.

`search-service.ts` is server-only and owns weighted text search, safe substring fallback, bounded fuzzy matching, autocomplete candidates, and search-mode reporting. The `/search` Server Component calls it directly while browser suggestions use the public Route Handler.
