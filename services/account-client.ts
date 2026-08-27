import type { ApiResponse } from "@/types/api";
import type { AccountAddress, AccountProfile } from "@/types/account";
import { requestCsrfToken } from "@/services/csrf-client";

export type AccountClientError = {
  code: string;
  message: string;
  details?: Record<string, string[]>;
};

type MutationResult<T> = { success: true; data: T } | { success: false; error: AccountClientError };

async function mutateAccount<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  data?: unknown,
): Promise<MutationResult<T>> {
  try {
    const csrfToken = await requestCsrfToken();
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    const body = (await response.json()) as ApiResponse<T>;

    if (response.ok && body.success) return { success: true, data: body.data };

    return {
      success: false,
      error: body.success
        ? { code: "REQUEST_FAILED", message: "请求失败，请稍后重试。" }
        : {
            code: body.error.code,
            message: body.error.message,
            ...(body.error.details ? { details: body.error.details } : {}),
          },
    };
  } catch {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "网络异常，修改尚未保存。" },
    };
  }
}

export function updateProfile(input: { name: string; avatar: string }) {
  return mutateAccount<{ profile: AccountProfile }>("/api/account/profile", "PATCH", input);
}

export function saveAddress(input: AccountAddress) {
  return mutateAccount<{ address: AccountAddress | null }>("/api/account/address", "PUT", input);
}

export function deleteAddress() {
  return mutateAccount<{ address: null }>("/api/account/address", "DELETE");
}

export function addWishlistItem(productId: string) {
  return mutateAccount<{ productId: string; wishlisted: true }>("/api/wishlist/items", "POST", {
    productId,
  });
}

export function removeWishlistItem(productId: string) {
  return mutateAccount<{ productId: string; wishlisted: false }>(
    `/api/wishlist/items/${encodeURIComponent(productId)}`,
    "DELETE",
  );
}
