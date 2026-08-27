import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import {
  stripePaymentIntentMatchesOrder,
  stripePaymentTransition,
} from "@/lib/stripe/payment-intent";
import { constructStripeWebhookEvent } from "@/lib/stripe/webhook";

const orderId = "507f1f77bcf86cd799439012";
const userId = "507f1f77bcf86cd799439013";

function paymentIntent(overrides: Partial<Stripe.PaymentIntent> = {}): Stripe.PaymentIntent {
  return {
    id: "pi_test_trusted",
    object: "payment_intent",
    amount: 43000,
    amount_received: 43000,
    currency: "jpy",
    metadata: { orderId, userId },
    status: "succeeded",
    ...overrides,
  } as Stripe.PaymentIntent;
}

test("Stripe webhook verification requires the exact raw payload and signing secret", () => {
  const stripe = new Stripe("sk_test_signature_generation_only");
  const secret = "whsec_test_signature_secret";
  const payload = JSON.stringify({ id: "evt_test_1", object: "event", type: "ping" });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
    timestamp: Math.floor(Date.now() / 1000),
  });

  const event = constructStripeWebhookEvent(payload, signature, secret);
  assert.equal(event.id, "evt_test_1");
  assert.throws(() => constructStripeWebhookEvent(`${payload} `, signature, secret), /signature/i);
  assert.throws(() => constructStripeWebhookEvent(payload, signature, "whsec_wrong"), /signature/i);
});

test("PaymentIntent integrity binds amount, currency, intent, order, and user", () => {
  const order = {
    id: orderId,
    userId,
    totalAmount: 43000,
    currency: "jpy",
    stripePaymentIntentId: "pi_test_trusted",
  };

  assert.equal(stripePaymentIntentMatchesOrder(paymentIntent(), order), true);
  assert.equal(stripePaymentIntentMatchesOrder(paymentIntent({ amount: 1 }), order), false);
  assert.equal(
    stripePaymentIntentMatchesOrder(
      paymentIntent({ metadata: { orderId, userId: "other" } }),
      order,
    ),
    false,
  );
});

test("Only supported PaymentIntent webhook events produce payment transitions", () => {
  const created = 1_787_788_800;
  const paid = stripePaymentTransition("payment_intent.succeeded", paymentIntent(), created);
  const failed = stripePaymentTransition(
    "payment_intent.payment_failed",
    paymentIntent({
      status: "requires_payment_method",
      amount_received: 0,
      last_payment_error: { code: "card_declined" } as Stripe.PaymentIntent.LastPaymentError,
    }),
    created,
  );

  assert.equal(paid?.paymentStatus, "paid");
  assert.equal(paid?.confirmOrder, true);
  assert.equal(paid?.paidAt?.toISOString(), "2026-08-27T00:00:00.000Z");
  assert.equal(failed?.paymentStatus, "failed");
  assert.equal(failed?.failureCode, "card_declined");
  assert.equal(
    stripePaymentTransition(
      "payment_intent.succeeded",
      paymentIntent({ amount_received: 0 }),
      created,
    ),
    null,
  );
  assert.equal(stripePaymentTransition("payment_intent.created", paymentIntent(), created), null);
});
