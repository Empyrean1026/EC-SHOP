export function isRequestOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const configuredUrl = process.env.APP_URL;
  if (!configuredUrl) return false;

  try {
    return origin === new URL(configuredUrl).origin;
  } catch {
    return false;
  }
}
