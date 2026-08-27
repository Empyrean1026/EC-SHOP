import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { logServerEvent } from "@/lib/api/logger";
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
      return apiInternalError(
        error,
        "api.stripe.webhook.configure",
        "Webhook endpoint is not configured.",
        "WEBHOOK_NOT_CONFIGURED",
      );
    }
    logServerEvent("warn", "api.stripe.webhook.signature", "Signature verification failed.");
    return apiError("INVALID_STRIPE_SIGNATURE", "Stripe signature is invalid.", 400);
  }

  try {
    const result = await processStripeWebhookEvent(event);
    if (result.handled && !result.updated) {
      logServerEvent("info", "api.stripe.webhook.noop", "Event required no order update.", {
        eventId: event.id,
      });
    }
    return apiSuccess({ received: true });
  } catch (error) {
    return apiInternalError(
      error,
      `api.stripe.webhook.process.${event.id}`,
      "Webhook processing failed.",
      "WEBHOOK_PROCESSING_FAILED",
    );
  }
}
