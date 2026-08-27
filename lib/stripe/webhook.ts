import Stripe from "stripe";

export function constructStripeWebhookEvent(
  rawBody: string,
  signature: string,
  webhookSecret: string,
): Stripe.Event {
  const stripe = new Stripe("sk_test_webhook_signature_verification_only");
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
