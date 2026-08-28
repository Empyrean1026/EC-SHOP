import { requestCsrfToken } from "@/services/csrf-client";
import { networkError, parseApiResponse } from "@/services/api-client";
import type { CreateCheckoutOrderInput } from "@/lib/validations/checkout";
import type { ApiError } from "@/types/api";
import type { CreateCheckoutOrderResult } from "@/types/checkout";

export type CheckoutClientError = ApiError;

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
    return parseApiResponse<CreateCheckoutOrderResult>(
      response,
      "注文の作成に失敗しました。しばらくしてからお試しください。",
    );
  } catch {
    return {
      success: false,
      error: networkError("通信エラーが発生し、注文は確定されていません。もう一度お試しください。"),
    };
  }
}
