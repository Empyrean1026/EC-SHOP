import type { ShoppingCart } from "@/types/cart";
import { networkError, parseApiResponse } from "@/services/api-client";
import { requestCsrfToken } from "@/services/csrf-client";
import type { ApiError } from "@/types/api";

export type CartClientError = ApiError;

export type CartClientResult =
  { success: true; cart: ShoppingCart } | { success: false; error: CartClientError };

export type AccountCartResult =
  | { authenticated: true; cart: ShoppingCart }
  | { authenticated: false }
  | { authenticated: null; error: CartClientError };

async function parseCartResponse(response: Response): Promise<CartClientResult> {
  const result = await parseApiResponse<{ cart: ShoppingCart }>(response, "购物车请求失败。");

  if (result.success) {
    return { success: true, cart: result.data.cart };
  }

  return result;
}

async function mutateCart(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  data?: unknown,
): Promise<CartClientResult> {
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

    return parseCartResponse(response);
  } catch {
    return {
      success: false,
      error: networkError("网络异常，购物车尚未更新。"),
    };
  }
}

export async function fetchAccountCart(): Promise<AccountCartResult> {
  try {
    const response = await fetch("/api/cart", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (response.status === 401) return { authenticated: false };

    const result = await parseCartResponse(response);
    return result.success
      ? { authenticated: true, cart: result.cart }
      : { authenticated: null, error: result.error };
  } catch {
    return {
      authenticated: null,
      error: networkError("暂时无法同步购物车。"),
    };
  }
}

export async function validateGuestCart(items: ShoppingCart["items"]): Promise<CartClientResult> {
  try {
    const response = await fetch("/api/cart/validate", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      }),
    });

    return parseCartResponse(response);
  } catch {
    return {
      success: false,
      error: networkError("暂时无法刷新商品库存。"),
    };
  }
}

export function addAccountCartItem(productId: string, quantity = 1) {
  return mutateCart("/api/cart/items", "POST", { productId, quantity });
}

export function updateAccountCartItem(productId: string, quantity: number) {
  return mutateCart(`/api/cart/items/${encodeURIComponent(productId)}`, "PATCH", { quantity });
}

export function removeAccountCartItem(productId: string) {
  return mutateCart(`/api/cart/items/${encodeURIComponent(productId)}`, "DELETE");
}

export function clearAccountCart() {
  return mutateCart("/api/cart", "DELETE");
}

export function mergeAccountCart(items: ShoppingCart["items"]) {
  return mutateCart("/api/cart/sync", "POST", {
    items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
  });
}
