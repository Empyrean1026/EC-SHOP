import type { ApiResponse } from "@/types/api";

export async function requestCsrfToken(): Promise<string> {
  const response = await fetch("/api/auth/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = (await response.json()) as ApiResponse<{ csrfToken: string }>;

  if (!response.ok || !body.success) {
    throw new Error("无法初始化安全会话，请刷新页面后重试。");
  }

  return body.data.csrfToken;
}
