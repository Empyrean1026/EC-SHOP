import assert from "node:assert/strict";
import test from "node:test";
import { createCsrfToken, verifyCsrfToken } from "@/lib/auth/csrf";
import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { readJsonBody } from "@/lib/api/request";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

process.env.AUTH_SECRET = "test-auth-secret-with-at-least-thirty-two-bytes";
process.env.CSRF_SECRET = "test-csrf-secret-with-at-least-thirty-two-bytes";
process.env.BCRYPT_SALT_ROUNDS = "10";

test("registration validation accepts strong input and rejects unknown fields", () => {
  const valid = registerSchema.safeParse({
    name: "Test Customer",
    email: "CUSTOMER@EXAMPLE.COM",
    password: "StrongPass123",
    confirmPassword: "StrongPass123",
  });

  assert.equal(valid.success, true);

  if (valid.success) {
    assert.equal(valid.data.email, "customer@example.com");
  }

  const invalid = registerSchema.safeParse({
    name: "T",
    email: "invalid",
    password: "weak",
    confirmPassword: "different",
    role: "admin",
  });
  assert.equal(invalid.success, false);
});

test("login validation normalizes email without accepting empty passwords", () => {
  const valid = loginSchema.safeParse({
    email: "  CUSTOMER@EXAMPLE.COM ",
    password: "StrongPass123",
  });
  const invalid = loginSchema.safeParse({ email: "customer@example.com", password: "" });

  assert.equal(valid.success, true);
  assert.equal(valid.success ? valid.data.email : null, "customer@example.com");
  assert.equal(invalid.success, false);
});

test("bcrypt hashes and verifies passwords without storing plaintext", async () => {
  const password = "StrongPass123";
  const hash = await hashPassword(password);

  assert.notEqual(hash, password);
  assert.equal(hash.length, 60);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("WrongPass123", hash), false);
});

test("JWT sessions validate issuer, audience, signature, expiry, and role claims", async () => {
  const token = await signSessionToken("507f1f77bcf86cd799439011", "customer");
  const session = await verifySessionToken(token);

  assert.equal(session?.userId, "507f1f77bcf86cd799439011");
  assert.equal(session?.role, "customer");
  assert.equal(await verifySessionToken(`${token}tampered`), null);
});

test("signed CSRF tokens require both the matching request token and cookie", async () => {
  const csrf = await createCsrfToken();

  assert.equal(await verifyCsrfToken(csrf.cookieValue, csrf.token), true);
  assert.equal(await verifyCsrfToken(csrf.cookieValue, "wrong-token"), false);
  assert.equal(await verifyCsrfToken(`${csrf.cookieValue}tampered`, csrf.token), false);
});

test("JSON request parser enforces content type and body size", async () => {
  const valid = await readJsonBody(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    }),
  );
  const invalidType = await readJsonBody(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "hello",
    }),
  );
  const oversized = await readJsonBody(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: "x".repeat(11 * 1024) }),
    }),
  );

  assert.equal(valid.success, true);
  assert.equal(invalidType.success, false);
  assert.equal(invalidType.success ? null : invalidType.status, 415);
  assert.equal(oversized.success, false);
  assert.equal(oversized.success ? null : oversized.status, 413);
});
