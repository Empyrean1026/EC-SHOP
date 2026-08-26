import type { ApiResponse } from "@/types/api";
import type { AuthUser } from "@/types/auth";

export type AuthClientError = {
  message: string;
  details?: Record<string, string[]>;
};

export type AuthClientResult =
  { success: true; user: AuthUser } | { success: false; error: AuthClientError };

async function requestCsrfToken(): Promise<string> {
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

async function postAuth<T>(path: string, data?: T): Promise<Response> {
  const csrfToken = await requestCsrfToken();

  return fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(data ?? {}),
  });
}

async function parseAuthResult(response: Response): Promise<AuthClientResult> {
  const body = (await response.json()) as ApiResponse<{ user: AuthUser }>;

  if (response.ok && body.success) {
    return { success: true, user: body.data.user };
  }

  return {
    success: false,
    error: body.success
      ? { message: "请求失败，请稍后重试。" }
      : {
          message: body.error.message,
          ...(body.error.details ? { details: body.error.details } : {}),
        },
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthClientResult> {
  try {
    return await parseAuthResult(await postAuth("/api/auth/register", input));
  } catch {
    return { success: false, error: { message: "网络异常，请稍后重试。" } };
  }
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthClientResult> {
  try {
    return await parseAuthResult(await postAuth("/api/auth/login", input));
  } catch {
    return { success: false, error: { message: "网络异常，请稍后重试。" } };
  }
}

export async function logoutUser(): Promise<boolean> {
  try {
    const response = await postAuth("/api/auth/logout");
    return response.ok;
  } catch {
    return false;
  }
}
