import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | undefined;
let stripeClientKey: string | undefined;

export class StripeConfigurationError extends Error {
  constructor(variableName: string) {
    super(`Stripe configuration is missing or invalid: ${variableName}`);
    this.name = "StripeConfigurationError";
  }
}

function requiredStripeVariable(name: string, prefix: string): string {
  const value = process.env[name]?.trim();
  if (!value || !value.startsWith(prefix)) throw new StripeConfigurationError(name);
  return value;
}

export function getStripeClient(): Stripe {
  const secretKey = requiredStripeVariable("STRIPE_SECRET_KEY", "sk_");

  if (!stripeClient || stripeClientKey !== secretKey) {
    stripeClient = new Stripe(secretKey, {
      appInfo: { name: "EC Site", version: "0.1.0" },
      maxNetworkRetries: 2,
    });
    stripeClientKey = secretKey;
  }

  return stripeClient;
}

export function getStripePublishableKey(): string {
  return requiredStripeVariable("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_");
}

export function getStripeWebhookSecret(): string {
  return requiredStripeVariable("STRIPE_WEBHOOK_SECRET", "whsec_");
}
