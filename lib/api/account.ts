import { apiError } from "@/lib/api/response";
import { WishlistCapacityError, WishlistProductNotFoundError } from "@/services/wishlist-service";

export function accountServiceErrorResponse(error: unknown, context: string) {
  if (error instanceof WishlistProductNotFoundError) {
    return apiError("PRODUCT_NOT_FOUND", "商品不存在或已下架。", 404);
  }

  if (error instanceof WishlistCapacityError) {
    return apiError("WISHLIST_FULL", "收藏夹最多保存 100 件商品。", 409);
  }

  console.error(`[api/account] ${context}`, error);
  return apiError("INTERNAL_ERROR", "账户服务暂时不可用，请稍后重试。", 500);
}
