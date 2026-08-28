import { apiError, apiInternalError } from "@/lib/api/response";
import { WishlistCapacityError, WishlistProductNotFoundError } from "@/services/wishlist-service";

export function accountServiceErrorResponse(error: unknown, context: string) {
  if (error instanceof WishlistProductNotFoundError) {
    return apiError("PRODUCT_NOT_FOUND", "商品が見つからないか、販売を終了しています。", 404);
  }

  if (error instanceof WishlistCapacityError) {
    return apiError("WISHLIST_FULL", "お気に入りに登録できる商品は最大100点です。", 409);
  }

  return apiInternalError(
    error,
    `api.account.${context}`,
    "アカウントサービスを一時的に利用できません。しばらくしてからお試しください。",
  );
}
