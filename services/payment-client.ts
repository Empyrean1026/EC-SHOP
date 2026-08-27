import { requestCsrfToken } from "@/services/csrf-client";
import type { ApiResponse } from "@/types/api";
import type { OrderPaymentStatus, PaymentIntentSession } from "@/types/payment";

type PaymentClientResult<T> =
  { success: true; data: T } | { success: false; error: { code: string; message: string } };

async function responseResult<T>(response: Response): Promise<PaymentClientResult<T>> {
  const body = (await response.json()) as ApiResponse<T>;
  if (body.success) return { success: true, data: body.data };
  return { success: false, error: body.error };
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
      error: { code: "NETWORK_ERROR", message: "无法连接支付服务，请稍后重试。" },
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
      error: { code: "NETWORK_ERROR", message: "暂时无法读取支付状态。" },
    };
  }
}
