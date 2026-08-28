import { requestCsrfToken } from "@/services/csrf-client";
import { networkError, parseApiResponse } from "@/services/api-client";
import type { ApiError } from "@/types/api";
import type { OrderPaymentStatus, PaymentIntentSession } from "@/types/payment";

type PaymentClientResult<T> = { success: true; data: T } | { success: false; error: ApiError };

async function responseResult<T>(response: Response): Promise<PaymentClientResult<T>> {
  return parseApiResponse<T>(
    response,
    "決済リクエストに失敗しました。しばらくしてからお試しください。",
  );
}

export async function createPaymentIntentSession(
  orderId: string,
): Promise<PaymentClientResult<PaymentIntentSession>> {
  try {
    const csrfToken = await requestCsrfToken();
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/payment-intent`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-CSRF-Token": csrfToken },
    });
    return responseResult<PaymentIntentSession>(response);
  } catch {
    return {
      success: false,
      error: networkError("決済サービスに接続できません。しばらくしてからお試しください。"),
    };
  }
}

export async function fetchOrderPaymentStatus(
  orderId: string,
): Promise<PaymentClientResult<OrderPaymentStatus>> {
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/payment-status`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    return responseResult<OrderPaymentStatus>(response);
  } catch {
    return {
      success: false,
      error: networkError("お支払い状況を取得できません。"),
    };
  }
}
