import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
const compose = readFileSync(new URL("../docker-compose.yml", import.meta.url), "utf8");

test("Docker image uses a non-root standalone Next.js runtime with health checking", () => {
  assert.match(dockerfile, /FROM tools AS builder/);
  assert.match(dockerfile, /COPY --from=builder --chown=nextjs:nodejs \/app\/\.next\/standalone/);
  assert.match(dockerfile, /--ingroup nodejs nextjs/);
  assert.match(dockerfile, /USER nextjs/);
  assert.match(dockerfile, /HEALTHCHECK/);
  assert.match(dockerfile, /CMD \["node", "server\.js"\]/);
});

test("Compose waits for MongoDB and indexes before starting the application", () => {
  assert.match(compose, /mongodb:/);
  assert.match(compose, /db-init:/);
  assert.match(compose, /condition: service_healthy/);
  assert.match(compose, /condition: service_completed_successfully/);
  assert.match(compose, /command: \["npm", "run", "db:indexes"\]/);
  assert.match(compose, /MONGODB_URI: mongodb:\/\/mongodb:27017\/ec_site/);
});

test("Compose keeps MongoDB on an internal network without publishing its port", () => {
  const mongoService = compose.slice(compose.indexOf("  mongodb:"), compose.indexOf("  db-init:"));

  assert.doesNotMatch(mongoService, /ports:/);
  assert.match(compose, /database:\n\s+internal: true/);
  assert.match(compose, /mongodb_data:\/data\/db/);
});
