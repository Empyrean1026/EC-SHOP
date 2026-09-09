import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const port = process.env.E2E_PORT ?? "3100";
const hostname = "127.0.0.1";
const testOnlySecrets = {
  JWT_SECRET: "e2e-only-jwt-secret-with-at-least-32-bytes",
  CSRF_SECRET: "e2e-only-csrf-secret-with-at-least-32-bytes",
  STRIPE_WEBHOOK_SECRET: "whsec_e2e_invalid_signature_test_only",
};

rmSync(".next/dev/cache/fetch-cache", { recursive: true, force: true });

const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--hostname", hostname, "--port", port],
  {
    env: {
      ...process.env,
      APP_URL: `http://${hostname}:${port}`,
      JWT_SECRET: process.env.JWT_SECRET ?? testOnlySecrets.JWT_SECRET,
      CSRF_SECRET: process.env.CSRF_SECRET ?? testOnlySecrets.CSRF_SECRET,
      BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS ?? "10",
      DEEPSEEK_API_KEY: process.env.E2E_DEEPSEEK_API_KEY ?? "",
      STRIPE_WEBHOOK_SECRET:
        process.env.STRIPE_WEBHOOK_SECRET ?? testOnlySecrets.STRIPE_WEBHOOK_SECRET,
      WATCHPACK_POLLING: process.env.WATCHPACK_POLLING ?? "true",
      MONGODB_URI: process.env.E2E_MONGODB_URI ?? "mongodb://127.0.0.1:27017/ec_site_e2e",
    },
    stdio: "inherit",
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
