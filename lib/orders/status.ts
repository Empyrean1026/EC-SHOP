import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from "@/models/constants";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "待处理",
  paid: "已付款",
  processing: "处理中",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "待支付",
  processing: "支付处理中",
  paid: "已支付",
  failed: "支付失败",
  partially_refunded: "部分退款",
  refunded: "已退款",
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
