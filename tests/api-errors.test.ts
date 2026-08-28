import assert from "node:assert/strict";
import test from "node:test";
import { apiError, apiInternalError, withApiErrorHandling } from "@/lib/api/response";
import { networkError, parseApiResponse } from "@/services/api-client";

test("API errors use one flat response contract without a nested error object", async () => {
  const response = apiError("PRODUCT_NOT_FOUND", "Product not found", 404, {
    productId: ["Unknown product"],
  });

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Product not found",
    code: "PRODUCT_NOT_FOUND",
    details: { productId: ["Unknown product"] },
  });
});

test("internal API errors are logged, correlated, and hide exception details", async () => {
  const messages: string[] = [];
  const originalConsoleError = console.error;
  console.error = (message?: unknown) => messages.push(String(message));

  try {
    const response = apiInternalError(
      new Error("sensitive database connection details"),
      "api.products.list",
      "商品を読み込めません。",
    );
    const body = (await response.json()) as Record<string, unknown>;
    const requestId = String(body.requestId);

    assert.equal(response.status, 500);
    assert.equal(body.success, false);
    assert.equal(body.message, "商品を読み込めません。");
    assert.equal(body.code, "INTERNAL_ERROR");
    assert.match(requestId, /^[0-9a-f-]{36}$/);
    assert.equal(response.headers.get("x-request-id"), requestId);
    assert.doesNotMatch(JSON.stringify(body), /sensitive database connection details/);

    const log = JSON.parse(messages[0] ?? "{}") as Record<string, unknown>;
    assert.equal(log.level, "error");
    assert.equal(log.context, "api.products.list");
    assert.equal(log.requestId, requestId);
  } finally {
    console.error = originalConsoleError;
  }
});

test("the global API wrapper converts uncaught exceptions to safe JSON", async () => {
  const originalConsoleError = console.error;
  console.error = () => undefined;

  try {
    const handler = withApiErrorHandling(async () => {
      throw new Error("private implementation detail");
    }, "api.test.unhandled");
    const response = await handler();
    const body = (await response.json()) as Record<string, unknown>;

    assert.equal(response.status, 500);
    assert.equal(body.success, false);
    assert.equal(
      body.message,
      "サービスを一時的に利用できません。しばらくしてからお試しください。",
    );
    assert.doesNotMatch(JSON.stringify(body), /private implementation detail/);
  } finally {
    console.error = originalConsoleError;
  }
});

test("API clients handle success, typed errors, and malformed responses", async () => {
  const success = await parseApiResponse<{ id: string }>(
    Response.json({ success: true, data: { id: "product-1" } }),
  );
  assert.deepEqual(success, { success: true, data: { id: "product-1" } });

  const failure = await parseApiResponse(
    Response.json(
      { success: false, message: "Product not found", code: "PRODUCT_NOT_FOUND" },
      { status: 404 },
    ),
  );
  assert.equal(failure.success, false);
  if (!failure.success) assert.equal(failure.error.code, "PRODUCT_NOT_FOUND");

  const malformed = await parseApiResponse(new Response("gateway unavailable", { status: 502 }));
  assert.equal(malformed.success, false);
  if (!malformed.success) assert.equal(malformed.error.code, "INVALID_RESPONSE");

  assert.deepEqual(networkError("离线"), {
    success: false,
    code: "NETWORK_ERROR",
    message: "离线",
  });
});
