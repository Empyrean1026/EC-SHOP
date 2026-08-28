import type { ApiResponse } from "@/types/api";

export async function requestCsrfToken(): Promise<string> {
  const response = await fetch("/api/auth/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = (await response.json()) as ApiResponse<{ csrfToken: string }>;

  if (!response.ok || !body.success) {
    throw new Error("安全なセッションを開始できません。ページを再読み込みしてお試しください。");
  }

  return body.data.csrfToken;
}
