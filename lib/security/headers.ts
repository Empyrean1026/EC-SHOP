const STRIPE_FRAME_ORIGINS = [
  "https://js.stripe.com",
  "https://*.js.stripe.com",
  "https://hooks.stripe.com",
  "https://link.com",
  "https://*.link.com",
];

export function shouldUpgradeInsecureRequests(applicationUrl = process.env.APP_URL): boolean {
  if (!applicationUrl) return false;

  try {
    return new URL(applicationUrl).protocol === "https:";
  } catch {
    return false;
  }
}

export function buildContentSecurityPolicy(
  nonce: string,
  development = false,
  upgradeInsecureRequests = shouldUpgradeInsecureRequests(),
): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""} https://js.stripe.com https://*.js.stripe.com https://maps.googleapis.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://link.com https://*.link.com${development ? " ws: wss:" : ""}`,
    `frame-src ${STRIPE_FRAME_ORIGINS.join(" ")}`,
    "worker-src 'self' blob:",
    "media-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(!development && upgradeInsecureRequests ? ["upgrade-insecure-requests"] : []),
  ];

  return directives.join("; ");
}

export function createCspNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}
