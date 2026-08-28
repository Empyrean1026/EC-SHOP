import { NextResponse } from "next/server";
import { createRequestId, logServerError } from "@/lib/api/logger";
import type { ApiResponse } from "@/types/api";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      status,
      headers: noStoreHeaders,
    },
  );
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      message,
      code,
      ...(details ? { details } : {}),
    },
    {
      status,
      headers: noStoreHeaders,
    },
  );
}

export function apiInternalError(
  error: unknown,
  context: string,
  message = "サービスを一時的に利用できません。しばらくしてからお試しください。",
  code = "INTERNAL_ERROR",
  status = 500,
) {
  const requestId = createRequestId();
  logServerError({ requestId, context, error });

  return NextResponse.json(
    { success: false as const, message, code, requestId },
    { status, headers: { ...noStoreHeaders, "X-Request-Id": requestId } },
  );
}

export function withApiErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Response | Promise<Response>,
  context: string,
  message?: string,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return apiInternalError(error, context, message);
    }
  };
}
