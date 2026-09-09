import { config } from "dotenv";

const result = config({ path: ".env.local", quiet: true });

if (result.error) {
  console.error("Environment check failed: .env.local could not be loaded.");
  process.exit(1);
}

const requiredVariables = ["MONGODB_URI", "APP_URL", "CSRF_SECRET", "BCRYPT_SALT_ROUNDS"];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (!process.env.JWT_SECRET && !process.env.AUTH_SECRET) {
  missingVariables.push("JWT_SECRET");
}

if (missingVariables.length > 0) {
  console.error(`Environment check failed: missing ${missingVariables.join(", ")}.`);
  process.exit(1);
}

const jwtSecret = process.env.JWT_SECRET ?? process.env.AUTH_SECRET ?? "";

if (new TextEncoder().encode(jwtSecret).byteLength < 32) {
  console.error("Environment check failed: JWT_SECRET must contain at least 32 bytes.");
  process.exit(1);
}

if (new TextEncoder().encode(process.env.CSRF_SECRET).byteLength < 32) {
  console.error("Environment check failed: CSRF_SECRET must contain at least 32 bytes.");
  process.exit(1);
}

const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);

if (!Number.isInteger(bcryptSaltRounds) || bcryptSaltRounds < 10 || bcryptSaltRounds > 14) {
  console.error("Environment check failed: BCRYPT_SALT_ROUNDS must be between 10 and 14.");
  process.exit(1);
}

if (process.env.TRUST_PROXY && !["true", "false"].includes(process.env.TRUST_PROXY)) {
  console.error("Environment check failed: TRUST_PROXY must be true or false.");
  process.exit(1);
}

if (process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY) {
  console.error("Environment check failed: DeepSeek API keys must never use a NEXT_PUBLIC_ name.");
  process.exit(1);
}

if (process.env.DEEPSEEK_BASE_URL) {
  try {
    const deepSeekBaseUrl = new URL(process.env.DEEPSEEK_BASE_URL);

    if (!["http:", "https:"].includes(deepSeekBaseUrl.protocol)) {
      throw new Error("Unsupported DeepSeek URL protocol");
    }
  } catch {
    console.error("Environment check failed: DEEPSEEK_BASE_URL must be a valid HTTP(S) URL.");
    process.exit(1);
  }
}

if (process.env.DEEPSEEK_MODEL !== undefined && !process.env.DEEPSEEK_MODEL.trim()) {
  console.error("Environment check failed: DEEPSEEK_MODEL cannot be empty when configured.");
  process.exit(1);
}

const stripeVariables = {
  STRIPE_SECRET_KEY: "sk_",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_",
  STRIPE_WEBHOOK_SECRET: "whsec_",
};
const configuredStripeVariables = Object.keys(stripeVariables).filter((name) => process.env[name]);

if (
  configuredStripeVariables.length > 0 &&
  configuredStripeVariables.length !== Object.keys(stripeVariables).length
) {
  console.error("Environment check failed: configure all Stripe variables or none of them.");
  process.exit(1);
}

for (const [name, prefix] of Object.entries(stripeVariables)) {
  const value = process.env[name];
  if (value && !value.startsWith(prefix)) {
    console.error(`Environment check failed: ${name} must start with ${prefix}.`);
    process.exit(1);
  }
}

console.log("Environment check passed.");
