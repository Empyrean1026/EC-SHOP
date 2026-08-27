import type { ApiError, ApiResponse } from "@/types/api";

export type ApiClientResult<T> = { success: true; data: T } | { success: false; error: ApiError };

function fallbackError(message: string, code = "REQUEST_FAILED"): ApiError {
  return { success: false, code, message };
}

export async function parseApiResponse<T>(
  response: Response,
  fallbackMessage = "请求失败，请稍后重试。",
): Promise<ApiClientResult<T>> {
  let body: ApiResponse<T>;

  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    return { success: false, error: fallbackError(fallbackMessage, "INVALID_RESPONSE") };
  }

  if (response.ok && body.success) {
    return { success: true, data: body.data };
  }

  if (!body.success && typeof body.message === "string" && typeof body.code === "string") {
    return {
      success: false,
      error: {
        success: false,
        code: body.code,
        message: body.message,
        ...(body.details ? { details: body.details } : {}),
        ...(body.requestId ? { requestId: body.requestId } : {}),
      },
    };
  }

  return { success: false, error: fallbackError(fallbackMessage) };
}

export function networkError(message: string): ApiError {
  return fallbackError(message, "NETWORK_ERROR");
}
