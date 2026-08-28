import { apiError, apiInternalError } from "@/lib/api/response";
import {
  CheckoutAmountError,
  CheckoutCartChangedError,
  CheckoutCurrencyError,
  CheckoutEmptyCartError,
} from "@/services/checkout-service";

export function checkoutServiceErrorResponse(error: unknown, context: string) {
  if (error instanceof CheckoutEmptyCartError) {
    return apiError("EMPTY_CART", "カートが空のため、注文を作成できません。", 409);
  }

  if (error instanceof CheckoutCartChangedError) {
    return apiError(
      "CHECKOUT_CART_CHANGED",
      "商品の価格、在庫、またはカート内容が変更されました。もう一度ご確認ください。",
      409,
    );
  }

  if (error instanceof CheckoutCurrencyError) {
    return apiError(
      "MULTIPLE_CURRENCIES",
      "1回の購入手続きでは同じ通貨の商品だけを注文できます。",
      409,
    );
  }

  if (error instanceof CheckoutAmountError) {
    return apiError("INVALID_ORDER_AMOUNT", "注文金額が対応範囲を超えています。", 409);
  }

  return apiInternalError(
    error,
    `api.checkout.${context}`,
    "注文を作成できません。しばらくしてからお試しください。",
  );
}
