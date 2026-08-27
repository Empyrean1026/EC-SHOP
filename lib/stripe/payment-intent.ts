import type Stripe from "stripe";
import type { PaymentStatus } from "@/models";

export type StripePaymentOrderSnapshot = {
  id: string;
  userId: string;
  totalAmount: number;
  currency: string;
  stripePaymentIntentId: string;
};

export type StripePaymentTransition = {
  paymentStatus: Extract<PaymentStatus, "processing" | "paid" | "failed">;
  confirmOrder: boolean;
  paidAt: Date | null;
  failureCode: string | null;
};

export const STRIPE_MUTABLE_PAYMENT_STATUSES: PaymentStatus[] = ["pending", "processing", "failed"];

export function stripePaymentIntentMatchesOrder(
  paymentIntent: Stripe.PaymentIntent,
  order: StripePaymentOrderSnapshot,
): boolean {
  return (
    paymentIntent.id === order.stripePaymentIntentId &&
    paymentIntent.metadata.orderId === order.id &&
    paymentIntent.metadata.userId === order.userId &&
    paymentIntent.amount === order.totalAmount &&
    paymentIntent.currency.toLowerCase() === order.currency.toLowerCase()
  );
}

export function stripePaymentTransition(
  eventType: Stripe.Event.Type,
  paymentIntent: Stripe.PaymentIntent,
  eventCreated: number,
): StripePaymentTransition | null {
  if (eventType === "payment_intent.succeeded") {
    if (paymentIntent.amount_received !== paymentIntent.amount) return null;
    return {
      paymentStatus: "paid",
      confirmOrder: true,
      paidAt: new Date(eventCreated * 1000),
      failureCode: null,
    };
  }

  if (eventType === "payment_intent.processing") {
    return {
      paymentStatus: "processing",
      confirmOrder: false,
      paidAt: null,
      failureCode: null,
    };
  }

  if (eventType === "payment_intent.payment_failed") {
    return {
      paymentStatus: "failed",
      confirmOrder: false,
      paidAt: null,
      failureCode: paymentIntent.last_payment_error?.code ?? "payment_failed",
    };
  }

  if (eventType === "payment_intent.canceled") {
    return {
      paymentStatus: "failed",
      confirmOrder: false,
      paidAt: null,
      failureCode: "payment_intent_canceled",
    };
  }

  return null;
}
