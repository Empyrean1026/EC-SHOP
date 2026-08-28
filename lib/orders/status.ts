import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from "@/models/constants";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "注文受付",
  paid: "支払い済み",
  processing: "発送準備中",
  shipped: "発送済み",
  completed: "配送完了",
  cancelled: "キャンセル済み",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "未払い",
  processing: "支払い処理中",
  paid: "支払い済み",
  failed: "支払い失敗",
  partially_refunded: "一部返金",
  refunded: "返金済み",
};

export const ORDER_PROGRESS_STATUSES: Exclude<OrderStatus, "cancelled">[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "completed",
];

export function normalizeOrderStatus(value: unknown): OrderStatus {
  if (value === "confirmed") return "paid";
  if (value === "delivered") return "completed";
  return ORDER_STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : "pending";
}

export function legacyCompatibleOrderStatusFilter(status: OrderStatus): string | string[] {
  if (status === "paid") return ["paid", "confirmed"];
  if (status === "completed") return ["completed", "delivered"];
  return status;
}
