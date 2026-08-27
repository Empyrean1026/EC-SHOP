import { apiError } from "@/lib/api/response";
import {
  CartCapacityError,
  CartItemNotFoundError,
  CartProductUnavailableError,
  CartStockExceededError,
} from "@/services/cart-service";

export function cartServiceErrorResponse(error: unknown, context: string) {
  if (error instanceof CartProductUnavailableError) {
    return apiError("PRODUCT_UNAVAILABLE", "该商品已下架或暂时缺货。", 409);
  }

  if (error instanceof CartStockExceededError) {
    return apiError("STOCK_LIMIT_EXCEEDED", "商品数量超过当前可用库存。", 409, {
      quantity: [`当前最多可购买 ${error.availableStock} 件`],
    });
  }

  if (error instanceof CartItemNotFoundError) {
    return apiError("CART_ITEM_NOT_FOUND", "购物车中没有该商品。", 404);
  }

  if (error instanceof CartCapacityError) {
    return apiError("CART_CAPACITY_REACHED", "购物车最多可包含 100 种商品。", 409);
  }

  console.error(`[api/cart] ${context}`, error);
  return apiError("INTERNAL_ERROR", "暂时无法更新购物车。", 500);
}
