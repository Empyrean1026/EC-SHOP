import assert from "node:assert/strict";
import test from "node:test";
import { isDemoServiceBlocked } from "../lib/demo";

test("public demo blocks external services and order mutations, preserves browsing/auth/cart", () => {
  for (const path of [
    "/api/ai/shopping",
    "/api/webhooks/stripe",
    "/api/orders",
    "/api/orders/123/payment-intent",
  ]) {
    assert.equal(isDemoServiceBlocked(path, "POST"), true);
  }
  for (const path of ["/api/products", "/api/orders", "/api/orders/123"]) {
    assert.equal(isDemoServiceBlocked(path, "GET"), false);
  }
  for (const path of ["/api/auth/register", "/api/auth/login", "/api/cart/items"]) {
    assert.equal(isDemoServiceBlocked(path, "POST"), false);
  }
});
