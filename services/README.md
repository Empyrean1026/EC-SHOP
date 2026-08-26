# Services

Domain services and external integrations live here. Keep transport details out of UI components.

`auth-client.ts` is the browser-side authentication transport. It obtains a signed CSRF token before every state-changing authentication request and never accesses the HttpOnly session cookie.
