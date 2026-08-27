import type { AccountAddress, AccountProfile } from "@/types/account";
import { networkError, parseApiResponse } from "@/services/api-client";
import { requestCsrfToken } from "@/services/csrf-client";
import type { ApiError } from "@/types/api";

export type AccountClientError = ApiError;

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
    return parseApiResponse<T>(response);
  } catch {
    return {
      success: false,
      error: networkError("网络异常，修改尚未保存。"),
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
