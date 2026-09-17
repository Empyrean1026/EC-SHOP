/** Server-side switch for the isolated public portfolio demo. */
export function isShopDemo(): boolean {
  return process.env.SHOP_DEMO_MODE === "true";
}

export function isDemoServiceBlocked(path: string, method: string): boolean {
  return (
    path.startsWith("/api/ai/") ||
    path.startsWith("/api/webhooks/") ||
    ((path === "/api/orders" || path.startsWith("/api/orders/")) &&
      !["GET", "HEAD", "OPTIONS"].includes(method))
  );
}
