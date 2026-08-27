import { requestCsrfToken } from "@/services/csrf-client";
import type { CreateCheckoutOrderInput } from "@/lib/validations/checkout";
import type { ApiResponse } from "@/types/api";
import type { CreateCheckoutOrderResult } from "@/types/checkout";

export type CheckoutClientError = {
  code: string;
  message: string;
  details?: Record<string, string[]>;
};

export type CheckoutClientResult =
  | { success: true; data: CreateCheckoutOrderResult }
  | { success: false; error: CheckoutClientError };

export async function submitCheckoutOrder(
  input: CreateCheckoutOrderInput,
): Promise<CheckoutClientResult> {
  try {
    const csrfToken = await requestCsrfToken();
    const response = await fetch("/api/orders", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(input),
    });
    const body = (await response.json()) as ApiResponse<CreateCheckoutOrderResult>;

    if (response.ok && body.success) return { success: true, data: body.data };

    return {
      success: false,
      error: body.success
        ? { code: "REQUEST_FAILED", message: "订单创建失败，请稍后重试。" }
        : {
            code: body.error.code,
            message: body.error.message,
            ...(body.error.details ? { details: body.error.details } : {}),
          },
    };
  } catch {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "网络异常，订单尚未确认，请重试。" },
    };
  }
}
