import type { AuthUser } from "@/types/auth";
import { networkError, parseApiResponse } from "@/services/api-client";
import { requestCsrfToken } from "@/services/csrf-client";
import type { ApiError } from "@/types/api";

export type AuthClientError = ApiError;

export type AuthClientResult =
  { success: true; user: AuthUser } | { success: false; error: AuthClientError };

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
  const result = await parseApiResponse<{ user: AuthUser }>(response);

  if (result.success) {
    return { success: true, user: result.data.user };
  }

  return result;
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
    return {
      success: false,
      error: networkError("通信エラーが発生しました。しばらくしてからお試しください。"),
    };
  }
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthClientResult> {
  try {
    return await parseAuthResult(await postAuth("/api/auth/login", input));
  } catch {
    return {
      success: false,
      error: networkError("通信エラーが発生しました。しばらくしてからお試しください。"),
    };
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
