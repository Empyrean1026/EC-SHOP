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
    return apiError("ORDER_NOT_FOUND", "订单不存在。", 404);
  }
  if (error instanceof PaymentMethodNotSupportedError) {
    return apiError("PAYMENT_METHOD_NOT_SUPPORTED", "该订单未选择 Stripe 支付。", 409);
  }
  if (error instanceof PaymentOrderStateError) {
    return apiError("ORDER_NOT_PAYABLE", "订单当前状态无法继续支付。", 409);
  }
  if (error instanceof PaymentIntentIntegrityError) {
    return apiError("PAYMENT_INTEGRITY_ERROR", "支付信息与订单不一致，请联系客服。", 409);
  }
  if (error instanceof StripeConfigurationError) {
    return apiError("PAYMENT_NOT_CONFIGURED", "在线支付暂未配置。", 503);
  }

  return apiInternalError(error, `api.payment.${context}`, "支付服务暂时不可用，请稍后重试。");
}
