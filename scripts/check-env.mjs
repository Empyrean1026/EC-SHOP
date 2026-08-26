import { config } from "dotenv";

const result = config({ path: ".env.local", quiet: true });

if (result.error) {
  console.error("Environment check failed: .env.local could not be loaded.");
  process.exit(1);
}

const requiredVariables = ["MONGODB_URI", "NEXT_PUBLIC_APP_URL"];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  console.error(`Environment check failed: missing ${missingVariables.join(", ")}.`);
  process.exit(1);
}

console.log("Environment check passed.");
