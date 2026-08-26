import { config } from "dotenv";

const result = config({ path: ".env.local", quiet: true });

if (result.error) {
  console.error("Environment check failed: .env.local could not be loaded.");
  process.exit(1);
}

const requiredVariables = [
  "MONGODB_URI",
  "APP_URL",
  "AUTH_SECRET",
  "CSRF_SECRET",
  "BCRYPT_SALT_ROUNDS",
];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  console.error(`Environment check failed: missing ${missingVariables.join(", ")}.`);
  process.exit(1);
}

for (const secretName of ["AUTH_SECRET", "CSRF_SECRET"]) {
  if (new TextEncoder().encode(process.env[secretName]).byteLength < 32) {
    console.error(`Environment check failed: ${secretName} must contain at least 32 bytes.`);
    process.exit(1);
  }
}

const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);

if (!Number.isInteger(bcryptSaltRounds) || bcryptSaltRounds < 10 || bcryptSaltRounds > 14) {
  console.error("Environment check failed: BCRYPT_SALT_ROUNDS must be between 10 and 14.");
  process.exit(1);
}

console.log("Environment check passed.");
