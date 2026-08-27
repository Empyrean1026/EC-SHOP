import type { OrderStatus, PaymentStatus } from "@/models";

export type StripeIntentStatus =
  | "canceled"
  | "processing"
  | "requires_action"
  | "requires_capture"
  | "requires_confirmation"
  | "requires_payment_method"
  | "succeeded";

export type PaymentIntentSession = {
  orderId: string;
  clientSecret: string | null;
  stripeStatus: StripeIntentStatus;
  paymentStatus: PaymentStatus;
};

export type OrderPaymentStatus = {
  orderId: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paidAt: string | null;
};
