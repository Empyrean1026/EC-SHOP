import { apiError, apiInternalError } from "@/lib/api/response";
import { StripeConfigurationError } from "@/lib/stripe/server";
import {
  PaymentIntentIntegrityError,
  PaymentMethodNotSupportedError,
  PaymentOrderNotFoundError,
  PaymentOrderStateError,
} from "@/services/payment-service";

export function paymentServiceErrorResponse(error: unknown, context: string) {
  if (error instanceof PaymentOrderNotFoundError) {
    return apiError("ORDER_NOT_FOUND", "注文が見つかりません。", 404);
  }
  if (error instanceof PaymentMethodNotSupportedError) {
    return apiError(
      "PAYMENT_METHOD_NOT_SUPPORTED",
      "この注文では Stripe 決済が選択されていません。",
      409,
    );
  }
  if (error instanceof PaymentOrderStateError) {
    return apiError("ORDER_NOT_PAYABLE", "現在の注文状況では決済を続行できません。", 409);
  }
  if (error instanceof PaymentIntentIntegrityError) {
    return apiError(
      "PAYMENT_INTEGRITY_ERROR",
      "決済情報が注文内容と一致しません。カスタマーサポートへお問い合わせください。",
      409,
    );
  }
  if (error instanceof StripeConfigurationError) {
    return apiError("PAYMENT_NOT_CONFIGURED", "オンライン決済が設定されていません。", 503);
  }

  return apiInternalError(
    error,
    `api.payment.${context}`,
    "決済サービスを一時的に利用できません。しばらくしてからお試しください。",
  );
}
