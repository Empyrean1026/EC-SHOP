import { NextResponse } from "next/server";
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
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    {
      status,
      headers: noStoreHeaders,
    },
  );
}
