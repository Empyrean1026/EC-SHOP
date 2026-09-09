import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_SHOPPING_MESSAGE_MAX_LENGTH,
  getAIShoppingErrorMessage,
  parseAIShoppingResponse,
  requestAIShopping,
} from "@/services/ai-shopping-client";

const product = {
  id: "507f1f77bcf86cd799439011",
  name: "E2Eテスト商品",
  slug: "e2e-test-product",
  description: "UIテストで使用する商品です。",
  category: { name: "テスト商品", slug: "e2e-products" },
  price: 6800,
  currency: "jpy",
  stock: 10,
  image: "/products/test.svg",
  url: "/products/e2e-test-product",
  recommendationReason: "ご希望の条件に合うためおすすめです。",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("AI shopping response validation accepts only grounded, safe product data", () => {
  const valid = {
    message: "ご希望に合う商品を選びました。",
    products: [product],
  };

  assert.deepEqual(parseAIShoppingResponse(valid), valid);
  assert.equal(
    parseAIShoppingResponse({
      ...valid,
      products: [{ ...product, price: "¥6,800" }],
    }),
    null,
  );
  assert.equal(
    parseAIShoppingResponse({
      ...valid,
      products: [{ ...product, url: "https://example.com/products/e2e-test-product" }],
    }),
    null,
  );
  assert.equal(
    parseAIShoppingResponse({
      ...valid,
      products: [{ ...product, url: "/products/other-product" }],
    }),
    null,
  );
  assert.equal(
    parseAIShoppingResponse({
      ...valid,
      products: [product, product, product, product],
    }),
    null,
  );
});

test("AI shopping client sends only the current trimmed message", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody: unknown;

  globalThis.fetch = (async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as unknown;
    return jsonResponse({
      success: true,
      data: {
        message: "ご希望に合う商品を選びました。",
        products: [product],
      },
    });
  }) as typeof fetch;

  try {
    const result = await requestAIShopping("  デスク周りの商品を探して  ");
    assert.equal(result.success, true);
    assert.deepEqual(requestBody, { message: "デスク周りの商品を探して" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("AI shopping client distinguishes rate limits, security errors, and provider failures", async () => {
  const originalFetch = globalThis.fetch;
  const cases = [
    { status: 429, code: "RATE_LIMITED", kind: "rate_limit" },
    { status: 403, code: "CORS_ORIGIN_DENIED", kind: "authentication" },
    { status: 503, code: "AI_PROVIDER_UNAVAILABLE", kind: "unavailable" },
  ] as const;

  try {
    for (const item of cases) {
      globalThis.fetch = (async () =>
        jsonResponse(
          {
            success: false,
            code: item.code,
            message: "Internal server wording must not control the UI.",
          },
          item.status,
        )) as typeof fetch;

      const result = await requestAIShopping("おすすめの商品を教えて");
      assert.equal(result.success, false);
      if (!result.success) assert.equal(result.error.kind, item.kind);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("AI shopping client safely handles malformed, network, aborted, and invalid input", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      jsonResponse({
        success: true,
        data: { message: "不完全", products: [{ id: "bad" }] },
      })) as typeof fetch;
    const malformed = await requestAIShopping("商品を探して");
    assert.equal(malformed.success, false);
    if (!malformed.success) assert.equal(malformed.error.kind, "invalid_response");

    globalThis.fetch = (async () => {
      throw new TypeError("network unavailable");
    }) as typeof fetch;
    const network = await requestAIShopping("商品を探して");
    assert.equal(network.success, false);
    if (!network.success) assert.equal(network.error.kind, "network");

    const controller = new AbortController();
    controller.abort();
    globalThis.fetch = (async () => {
      throw new DOMException("aborted", "AbortError");
    }) as typeof fetch;
    const aborted = await requestAIShopping("商品を探して", controller.signal);
    assert.equal(aborted.success, false);
    if (!aborted.success) assert.equal(aborted.error.kind, "aborted");

    let fetchCalled = false;
    globalThis.fetch = (async () => {
      fetchCalled = true;
      return jsonResponse({});
    }) as typeof fetch;
    const empty = await requestAIShopping("  ");
    const excessive = await requestAIShopping("あ".repeat(AI_SHOPPING_MESSAGE_MAX_LENGTH + 1));
    assert.equal(empty.success, false);
    assert.equal(excessive.success, false);
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("AI shopping error copy is safe and natural Japanese", () => {
  assert.match(getAIShoppingErrorMessage("rate_limit"), /リクエストが多すぎます/);
  assert.match(getAIShoppingErrorMessage("unavailable"), /接続に失敗しました/);
  assert.match(getAIShoppingErrorMessage("authentication"), /セキュリティ確認/);
  assert.match(getAIShoppingErrorMessage("invalid_response"), /正しく読み取れません/);
  assert.doesNotMatch(getAIShoppingErrorMessage("unavailable"), /DeepSeek|stack|JSON/i);
});
