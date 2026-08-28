import { apiError, apiInternalError } from "@/lib/api/response";
import {
  CartCapacityError,
  CartItemNotFoundError,
  CartProductUnavailableError,
  CartStockExceededError,
} from "@/services/cart-service";

export function cartServiceErrorResponse(error: unknown, context: string) {
  if (error instanceof CartProductUnavailableError) {
    return apiError("PRODUCT_UNAVAILABLE", "この商品は販売終了または在庫切れです。", 409);
  }

  if (error instanceof CartStockExceededError) {
    return apiError("STOCK_LIMIT_EXCEEDED", "数量が現在の在庫数を超えています。", 409, {
      quantity: [`現在購入できるのは最大${error.availableStock} 点`],
    });
  }

  if (error instanceof CartItemNotFoundError) {
    return apiError("CART_ITEM_NOT_FOUND", "カートにこの商品はありません。", 404);
  }

  if (error instanceof CartCapacityError) {
    return apiError("CART_CAPACITY_REACHED", "カートに追加できる商品は最大100種類です。", 409);
  }

  return apiInternalError(error, `api.cart.${context}`, "カートを更新できません。");
}
