import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/models";

export function getAllowedAdminOrderTransitions(
  status: OrderStatus,
  paymentStatus: PaymentStatus,
  paymentMethod: PaymentMethod,
): OrderStatus[] {
  switch (status) {
    case "pending":
      if (paymentMethod === "cash_on_delivery") return ["processing", "cancelled"];
      return paymentStatus === "paid" ? ["processing"] : ["cancelled"];
    case "paid":
      return paymentStatus === "paid" ? ["processing"] : [];
    case "processing":
      return ["shipped"];
    case "shipped":
      return ["completed"];
    case "completed":
    case "cancelled":
      return [];
  }
}

export function canAdminTransitionOrder(
  current: OrderStatus,
  next: OrderStatus,
  paymentStatus: PaymentStatus,
  paymentMethod: PaymentMethod,
): boolean {
  return getAllowedAdminOrderTransitions(current, paymentStatus, paymentMethod).includes(next);
}
