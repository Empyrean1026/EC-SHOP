import type { OrderListQuery } from "@/lib/validations/order";

export function buildOrderHistoryUrl(
  query: OrderListQuery,
  updates: Partial<OrderListQuery>,
): string {
  const next = { ...query, ...updates };
  const parameters = new URLSearchParams();

  if (next.status) parameters.set("status", next.status);
  if (next.paymentStatus) parameters.set("paymentStatus", next.paymentStatus);
  if (next.sort !== "newest") parameters.set("sort", next.sort);
  if (next.page > 1) parameters.set("page", String(next.page));
  if (next.limit !== 10) parameters.set("limit", String(next.limit));

  const search = parameters.toString();
  return search ? `/account/orders?${search}` : "/account/orders";
}
