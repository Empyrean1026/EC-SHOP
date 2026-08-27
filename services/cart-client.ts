import type { ApiResponse } from "@/types/api";
import type { ShoppingCart } from "@/types/cart";

export type CartClientError = {
  code: string;
  message: string;
  details?: Record<string, string[]>;
};

export type CartClientResult =
  { success: true; cart: ShoppingCart } | { success: false; error: CartClientError };

export type AccountCartResult =
  | { authenticated: true; cart: ShoppingCart }
  | { authenticated: false }
  | { authenticated: null; error: CartClientError };

async function requestCsrfToken(): Promise<string> {
  const response = await fetch("/api/auth/csrf", {
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = (await response.json()) as ApiResponse<{ csrfToken: string }>;

  if (!response.ok || !body.success) {
    throw new Error("无法初始化安全会话，请刷新页面后重试。");
  }

  return body.data.csrfToken;
}

async function parseCartResponse(response: Response): Promise<CartClientResult> {
  const body = (await response.json()) as ApiResponse<{ cart: ShoppingCart }>;

  if (response.ok && body.success) {
    return { success: true, cart: body.data.cart };
  }

  return {
    success: false,
    error: body.success
      ? { code: "REQUEST_FAILED", message: "购物车请求失败。" }
      : {
          code: body.error.code,
          message: body.error.message,
          ...(body.error.details ? { details: body.error.details } : {}),
        },
  };
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
      error: { code: "NETWORK_ERROR", message: "网络异常，购物车尚未更新。" },
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
      error: { code: "NETWORK_ERROR", message: "暂时无法同步购物车。" },
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
      error: { code: "NETWORK_ERROR", message: "暂时无法刷新商品库存。" },
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
