import { apiError } from "@/lib/api/response";
import {
  CheckoutAmountError,
  CheckoutCartChangedError,
  CheckoutCurrencyError,
  CheckoutEmptyCartError,
} from "@/services/checkout-service";

export function checkoutServiceErrorResponse(error: unknown, context: string) {
  if (error instanceof CheckoutEmptyCartError) {
    return apiError("EMPTY_CART", "购物车为空，无法创建订单。", 409);
  }

  if (error instanceof CheckoutCartChangedError) {
    return apiError(
      "CHECKOUT_CART_CHANGED",
      "商品价格、库存或购物车内容已经变化，请重新确认。",
      409,
    );
  }

  if (error instanceof CheckoutCurrencyError) {
    return apiError("MULTIPLE_CURRENCIES", "一次结算只能包含同一种币种。", 409);
  }

  if (error instanceof CheckoutAmountError) {
    return apiError("INVALID_ORDER_AMOUNT", "订单金额超出支持范围。", 409);
  }

  console.error(`[api/checkout] ${context}`, error);
  return apiError("INTERNAL_ERROR", "暂时无法创建订单，请稍后重试。", 500);
}
