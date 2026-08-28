import "server-only";

import { revalidateTag } from "next/cache";

export const CATALOG_CACHE_TAG = "catalog";

/**
 * Route handlers call this after a successful catalog mutation so public
 * reads never wait for the time-based revalidation window to expire.
 */
export function invalidateCatalogCache(): void {
  revalidateTag(CATALOG_CACHE_TAG, { expire: 0 });
}
