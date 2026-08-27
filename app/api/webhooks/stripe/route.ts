import { apiError, apiSuccess } from "@/lib/api/response";
import { getStripeWebhookSecret, StripeConfigurationError } from "@/lib/stripe/server";
import { constructStripeWebhookEvent } from "@/lib/stripe/webhook";
import { processStripeWebhookEvent } from "@/services/payment-service";

const MAX_STRIPE_WEBHOOK_BYTES = 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return apiError("MISSING_STRIPE_SIGNATURE", "Stripe signature is required.", 400);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_STRIPE_WEBHOOK_BYTES) {
    return apiError("PAYLOAD_TOO_LARGE", "Webhook payload is too large.", 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_STRIPE_WEBHOOK_BYTES) {
    return apiError("PAYLOAD_TOO_LARGE", "Webhook payload is too large.", 413);
  }

  let event;
  try {
    event = constructStripeWebhookEvent(rawBody, signature, getStripeWebhookSecret());
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      console.error("[stripe/webhook] Webhook secret is not configured.");
      return apiError("WEBHOOK_NOT_CONFIGURED", "Webhook endpoint is not configured.", 500);
    }
    console.warn("[stripe/webhook] Signature verification failed.");
    return apiError("INVALID_STRIPE_SIGNATURE", "Stripe signature is invalid.", 400);
  }

  try {
    const result = await processStripeWebhookEvent(event);
    if (result.handled && !result.updated) {
      console.info(`[stripe/webhook] Event ${event.id} required no order update.`);
    }
    return apiSuccess({ received: true });
  } catch (error) {
    console.error(`[stripe/webhook] Unable to process event ${event.id}.`, error);
    return apiError("WEBHOOK_PROCESSING_FAILED", "Webhook processing failed.", 500);
  }
}
