import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { NextRequest } from "next/server";
import { readJsonBody, containsUnsafeMongoKey } from "@/lib/api/request";
import { clearAuthAttempts, consumeAuthAttempt } from "@/lib/auth/rate-limit";
import { isRequestOriginAllowed } from "@/lib/security/cors";
import { buildContentSecurityPolicy } from "@/lib/security/headers";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { loginSchema } from "@/lib/validations/auth";
import { updateProfileSchema } from "@/lib/validations/account";

test("production CSP binds scripts to a nonce and permits required Stripe surfaces", () => {
  const policy = buildContentSecurityPolicy("random-nonce", false);

  assert.match(policy, /script-src 'self' 'nonce-random-nonce' 'strict-dynamic'/);
  assert.match(policy, /https:\/\/\*\.js\.stripe\.com/);
  assert.match(policy, /frame-src .*https:\/\/hooks\.stripe\.com/);
  assert.match(policy, /connect-src .*https:\/\/api\.stripe\.com/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /upgrade-insecure-requests/);
  assert.doesNotMatch(policy, /unsafe-eval/);

  const developmentPolicy = buildContentSecurityPolicy("dev-nonce", true);
  assert.match(developmentPolicy, /unsafe-eval/);
  assert.doesNotMatch(developmentPolicy, /upgrade-insecure-requests/);
});

test("CORS policy allows the configured origin and denies foreign browser origins", () => {
  const previousAppUrl = process.env.APP_URL;
  process.env.APP_URL = "https://shop.example.com";

  try {
    assert.equal(
      isRequestOriginAllowed(new Request("https://shop.example.com/api/products")),
      true,
    );
    assert.equal(
      isRequestOriginAllowed(
        new Request("https://shop.example.com/api/products", {
          headers: { Origin: "https://shop.example.com" },
        }),
      ),
      true,
    );
    assert.equal(
      isRequestOriginAllowed(
        new Request("https://shop.example.com/api/products", {
          headers: { Origin: "https://evil.example" },
        }),
      ),
      false,
    );
  } finally {
    if (previousAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previousAppUrl;
  }
});

test("rate limiter exposes remaining quota, blocks overflow, and resets its window", () => {
  const policy = { scope: `test-${crypto.randomUUID()}`, limit: 2, windowMs: 1_000 };
  const first = consumeRateLimit("client", policy, 10_000);
  const second = consumeRateLimit("client", policy, 10_100);
  const blocked = consumeRateLimit("client", policy, 10_200);
  const reset = consumeRateLimit("client", policy, 11_001);

  assert.deepEqual(
    [first.allowed, first.remaining, second.allowed, second.remaining, blocked.allowed],
    [true, 1, true, 0, false],
  );
  assert.equal(blocked.retryAfterSeconds, 1);
  assert.equal(reset.allowed, true);
  assert.equal(reset.remaining, 1);
});

test("authentication limiting ignores spoofed forwarding headers unless proxy trust is enabled", async () => {
  const previousTrustProxy = process.env.TRUST_PROXY;
  process.env.TRUST_PROXY = "false";
  const userAgent = `security-test-${crypto.randomUUID()}`;
  const request = (ip: string) =>
    new NextRequest("https://shop.example.com/api/auth/login", {
      headers: { "User-Agent": userAgent, "X-Forwarded-For": ip },
    });

  try {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      assert.equal(
        (await consumeAuthAttempt(request(`203.0.113.${attempt}`), "login")).allowed,
        true,
      );
    }
    assert.equal((await consumeAuthAttempt(request("198.51.100.10"), "login")).allowed, false);
  } finally {
    await clearAuthAttempts(request("127.0.0.1"), "login");
    if (previousTrustProxy === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = previousTrustProxy;
  }
});

test("JSON input rejects MongoDB operators, dotted paths, and prototype keys recursively", async () => {
  assert.equal(containsUnsafeMongoKey({ email: { $ne: null } }), true);
  assert.equal(containsUnsafeMongoKey({ profile: { "role.name": "admin" } }), true);
  assert.equal(containsUnsafeMongoKey(JSON.parse('{"__proto__":{"role":"admin"}}')), true);
  assert.equal(containsUnsafeMongoKey({ items: [{ productId: "abc" }] }), false);

  const result = await readJsonBody(
    new Request("https://shop.example.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: { $ne: null }, password: "Password1" }),
    }),
  );
  assert.deepEqual(result, {
    success: false,
    code: "UNSAFE_INPUT",
    message: "Request body contains forbidden object keys.",
    status: 400,
  });
  assert.equal(
    loginSchema.safeParse({ email: { $ne: null }, password: "Password1" }).success,
    false,
  );
});

test("React text rendering escapes markup and URL validation blocks script protocols", () => {
  const markup = renderToStaticMarkup(createElement("p", null, '<script>alert("xss")</script>'));
  assert.equal(markup, "<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>");
  assert.equal(
    updateProfileSchema.safeParse({ name: "安全用户", avatar: "javascript:alert(1)" }).success,
    false,
  );
});
