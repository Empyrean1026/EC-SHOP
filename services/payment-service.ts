import "server-only";

import { Types } from "mongoose";
import type Stripe from "stripe";
import {
  STRIPE_MUTABLE_PAYMENT_STATUSES,
  stripePaymentIntentMatchesOrder,
  stripePaymentTransition,
  type StripePaymentOrderSnapshot,
} from "@/lib/stripe/payment-intent";
import { getStripeClient } from "@/lib/stripe/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models";
import type { OrderStatus, PaymentStatus } from "@/models";
import type { OrderPaymentStatus, PaymentIntentSession } from "@/types/payment";

type PaymentOrderRecord = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  stripePaymentIntentId?: string;
  paidAt?: Date;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
};

export class PaymentOrderNotFoundError extends Error {
  constructor() {
    super("Payment order was not found");
    this.name = "PaymentOrderNotFoundError";
  }
}

export class PaymentMethodNotSupportedError extends Error {
  constructor() {
    super("Order does not use Stripe payment");
    this.name = "PaymentMethodNotSupportedError";
  }
}

export class PaymentOrderStateError extends Error {
  constructor(message = "Order cannot accept a payment in its current state") {
    super(message);
    this.name = "PaymentOrderStateError";
  }
}

export class PaymentIntentIntegrityError extends Error {
  constructor() {
    super("Stripe PaymentIntent does not match the stored order");
    this.name = "PaymentIntentIntegrityError";
  }
}

function orderSnapshot(order: PaymentOrderRecord): StripePaymentOrderSnapshot {
  return {
    id: order._id.toString(),
    userId: order.userId.toString(),
    totalAmount: order.totalAmount,
    currency: order.currency,
    stripePaymentIntentId: order.stripePaymentIntentId ?? "",
  };
}

function clientSecretForStatus(paymentIntent: Stripe.PaymentIntent): string | null {
  if (["canceled", "processing", "requires_capture", "succeeded"].includes(paymentIntent.status)) {
    return null;
  }
  return paymentIntent.client_secret;
}

function toPaymentIntentSession(
  order: PaymentOrderRecord,
  paymentIntent: Stripe.PaymentIntent,
): PaymentIntentSession {
  return {
    orderId: order._id.toString(),
    clientSecret: clientSecretForStatus(paymentIntent),
    stripeStatus: paymentIntent.status,
    paymentStatus: order.paymentStatus,
  };
}

async function findPaymentOrder(userId: string, orderId: string): Promise<PaymentOrderRecord> {
  if (!Types.ObjectId.isValid(orderId)) throw new PaymentOrderNotFoundError();

  const order = (await OrderModel.findOne({ _id: orderId, userId })
    .select(
      "_id userId totalAmount currency paymentMethod paymentStatus orderStatus stripePaymentIntentId paidAt shippingAddress",
    )
    .lean()) as PaymentOrderRecord | null;

  if (!order) throw new PaymentOrderNotFoundError();
  return order;
}

export async function createOrRetrievePaymentIntent(
  userId: string,
  orderId: string,
): Promise<PaymentIntentSession> {
  await connectToDatabase();
  const order = await findPaymentOrder(userId, orderId);

  if (order.paymentMethod !== "stripe") throw new PaymentMethodNotSupportedError();
  if (order.orderStatus === "cancelled") throw new PaymentOrderStateError();
  if (["partially_refunded", "refunded"].includes(order.paymentStatus)) {
    throw new PaymentOrderStateError();
  }

  const stripe = getStripeClient();

  if (order.stripePaymentIntentId) {
    const existingIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (!stripePaymentIntentMatchesOrder(existingIntent, orderSnapshot(order))) {
      throw new PaymentIntentIntegrityError();
    }
    if (existingIntent.status === "canceled") throw new PaymentOrderStateError();
    return toPaymentIntentSession(order, existingIntent);
  }

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: order.totalAmount,
      currency: order.currency,
      automatic_payment_methods: { enabled: true },
      description: `EC Site order ${order._id.toString()}`,
      metadata: {
        orderId: order._id.toString(),
        userId: order.userId.toString(),
      },
      shipping: {
        name: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        address: {
          line1: order.shippingAddress.line1,
          line2: order.shippingAddress.line2,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postal_code: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        },
      },
    },
    { idempotencyKey: `ec-order-${order._id.toString()}-payment-intent-v1` },
  );

  const bindResult = await OrderModel.updateOne(
    {
      _id: order._id,
      userId: order.userId,
      paymentMethod: "stripe",
      paymentStatus: { $in: STRIPE_MUTABLE_PAYMENT_STATUSES },
      $or: [
        { stripePaymentIntentId: { $exists: false } },
        { stripePaymentIntentId: paymentIntent.id },
      ],
    },
    {
      $set: { stripePaymentIntentId: paymentIntent.id },
    },
    { runValidators: true },
  );

  if (bindResult.matchedCount !== 1) {
    const currentOrder = await findPaymentOrder(userId, orderId);
    if (currentOrder.stripePaymentIntentId !== paymentIntent.id) {
      throw new PaymentIntentIntegrityError();
    }
    return toPaymentIntentSession(currentOrder, paymentIntent);
  }

  return toPaymentIntentSession(
    { ...order, stripePaymentIntentId: paymentIntent.id },
    paymentIntent,
  );
}

export async function getOrderPaymentStatus(
  userId: string,
  orderId: string,
): Promise<OrderPaymentStatus> {
  await connectToDatabase();
  const order = await findPaymentOrder(userId, orderId);

  return {
    orderId: order._id.toString(),
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    paidAt: order.paidAt?.toISOString() ?? null,
  };
}

export type StripeWebhookProcessingResult = {
  handled: boolean;
  updated: boolean;
};

export async function processStripeWebhookEvent(
  event: Stripe.Event,
): Promise<StripeWebhookProcessingResult> {
  const supportedTypes: Stripe.Event.Type[] = [
    "payment_intent.processing",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "payment_intent.canceled",
  ];

  if (!supportedTypes.includes(event.type)) return { handled: false, updated: false };

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata.orderId;
  const userId = paymentIntent.metadata.userId;
  if (!orderId || !userId || !Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(userId)) {
    console.warn(`[stripe/webhook] Event ${event.id} has invalid order metadata.`);
    return { handled: true, updated: false };
  }

  await connectToDatabase();
  const order = (await OrderModel.findOne({
    _id: orderId,
    userId,
    paymentMethod: "stripe",
    stripePaymentIntentId: paymentIntent.id,
  })
    .select("_id userId totalAmount currency stripePaymentIntentId")
    .lean()) as PaymentOrderRecord | null;

  if (!order || !stripePaymentIntentMatchesOrder(paymentIntent, orderSnapshot(order))) {
    console.warn(`[stripe/webhook] Event ${event.id} did not match a trusted order.`);
    return { handled: true, updated: false };
  }

  const transition = stripePaymentTransition(event.type, paymentIntent, event.created);
  if (!transition) {
    console.warn(`[stripe/webhook] Event ${event.id} failed amount or transition validation.`);
    return { handled: true, updated: false };
  }

  const eventAt = new Date(event.created * 1000);
  const allowedStatuses: PaymentStatus[] =
    transition.paymentStatus === "paid"
      ? [...STRIPE_MUTABLE_PAYMENT_STATUSES, "paid"]
      : STRIPE_MUTABLE_PAYMENT_STATUSES;
  const setFields: Record<string, unknown> = {
    paymentStatus: transition.paymentStatus,
    stripeLastEventId: event.id,
    stripeLastEventAt: eventAt,
  };
  if (transition.paidAt) setFields.paidAt = transition.paidAt;
  if (transition.failureCode) setFields.stripePaymentErrorCode = transition.failureCode;

  const update: Record<string, unknown> = { $set: setFields };
  if (!transition.failureCode) update.$unset = { stripePaymentErrorCode: "" };

  const result = await OrderModel.updateOne(
    {
      _id: orderId,
      userId,
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: { $in: allowedStatuses },
      $or: [{ stripeLastEventAt: { $exists: false } }, { stripeLastEventAt: { $lte: eventAt } }],
    },
    update,
    { runValidators: true },
  );

  if (transition.confirmOrder && result.matchedCount === 1) {
    await OrderModel.updateOne(
      { _id: orderId, userId, paymentStatus: "paid", orderStatus: "pending" },
      { $set: { orderStatus: "confirmed" } },
      { runValidators: true },
    );
  }

  return { handled: true, updated: result.modifiedCount === 1 };
}
