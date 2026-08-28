import { spawn } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const port = process.env.E2E_PORT ?? "3100";
const hostname = "127.0.0.1";
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--hostname", hostname, "--port", port],
  {
    env: {
      ...process.env,
      APP_URL: `http://${hostname}:${port}`,
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
