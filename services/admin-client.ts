import type { AdminOrderDetail } from "@/types/admin";
import type { OrderStatus } from "@/models";
import type { CatalogProduct } from "@/types/product";
import { networkError, parseApiResponse } from "@/services/api-client";
import { requestCsrfToken } from "@/services/csrf-client";
import type { ApiError } from "@/types/api";

export type AdminClientError = ApiError;

export type AdminClientResult<T> =
  { success: true; data: T } | { success: false; error: AdminClientError };

async function mutateAdmin<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  data?: unknown,
): Promise<AdminClientResult<T>> {
  try {
    const csrfToken = await requestCsrfToken();
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    return parseApiResponse<T>(response, "管理者リクエストに失敗しました。");
  } catch {
    return {
      success: false,
      error: networkError("通信エラーが発生し、操作を完了できませんでした。"),
    };
  }
}

export function createAdminProduct(input: unknown) {
  return mutateAdmin<{ product: CatalogProduct }>("/api/products", "POST", input);
}

export function updateAdminProduct(productId: string, input: unknown) {
  return mutateAdmin<{ product: CatalogProduct }>(
    `/api/products/${encodeURIComponent(productId)}`,
    "PUT",
    input,
  );
}

export function deactivateAdminProduct(productId: string) {
  return mutateAdmin<{ deleted: true; product: CatalogProduct }>(
    `/api/products/${encodeURIComponent(productId)}`,
    "DELETE",
  );
}

export function updateAdminStock(productId: string, stock: number) {
  return mutateAdmin<{ product: CatalogProduct }>(
    `/api/admin/products/${encodeURIComponent(productId)}/stock`,
    "PATCH",
    { stock },
  );
}

export function updateOrderStatus(orderId: string, orderStatus: OrderStatus) {
  return mutateAdmin<{ order: AdminOrderDetail }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
    "PATCH",
    { orderStatus },
  );
}
