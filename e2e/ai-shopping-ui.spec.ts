import { mkdir } from "node:fs/promises";
import { expect, test, type Page, type Route } from "@playwright/test";

const PRODUCT_ID = "507f1f77bcf86cd799439011";

const recommendation = {
  message: "ご希望に合う商品を選びました。",
  products: [
    {
      id: PRODUCT_ID,
      name: "E2Eテスト商品",
      slug: "e2e-test-product",
      description: "UIテストで使用する商品です。",
      category: { name: "テスト商品", slug: "e2e-products" },
      price: 6800,
      currency: "jpy",
      stock: 10,
      image: null,
      url: "/products/e2e-test-product",
      recommendationReason: "<script>alert(1)</script> 条件に合う商品です。",
    },
  ],
};

async function openAssistant(page: Page) {
  const launcher = page.getByRole("button", {
    name: "AIショッピングアシスタントを開く",
  });
  await expect(launcher).toBeVisible();
  await launcher.click();
  const dialog = page.getByRole("dialog", { name: "AIショッピングアシスタント" });
  await expect(dialog).toBeVisible();
  return { dialog, launcher };
}

function fulfillJson(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function captureReviewScreenshot(page: Page, name: string) {
  if (process.env.AI_P03_CAPTURE_SCREENSHOTS !== "true") return;
  await mkdir("test-results/ai-p03-review", { recursive: true });
  await page.screenshot({
    path: `test-results/ai-p03-review/${name}.png`,
    animations: "disabled",
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("desktop assistant opens, prevents duplicate submit, renders grounded data, and reuses cart", async ({
  page,
}) => {
  let releaseResponse: (() => void) | undefined;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  let requestCount = 0;
  let requestBody: unknown;

  await page.route("**/api/ai/shopping", async (route) => {
    requestCount += 1;
    requestBody = route.request().postDataJSON() as unknown;
    await responseGate;
    await fulfillJson(route, { success: true, data: recommendation });
  });

  await page.goto("/");
  const { dialog, launcher } = await openAssistant(page);
  await expect(dialog.getByText("こんにちは。商品選びをお手伝いします。")).toBeVisible();
  await captureReviewScreenshot(page, "desktop-assistant-open");
  const sendButton = dialog.getByRole("button", { name: "メッセージを送信" });
  const input = dialog.getByRole("textbox", { name: "商品のご希望" });
  await expect(sendButton).toBeDisabled();

  await input.fill("あ".repeat(1001));
  await expect(dialog.getByText("1,001 / 1,000")).toBeVisible();
  await expect(sendButton).toBeDisabled();
  await input.fill("");

  await dialog.getByRole("button", { name: "ダイアログを閉じる" }).click();
  await expect(dialog).toBeHidden();
  await expect(launcher).toBeFocused();
  await launcher.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(launcher).toBeFocused();
  await launcher.click();

  const userMessage = "<strong>5,000円以内で商品を探して</strong>";
  await input.fill(userMessage);
  await input.press("Enter");
  await input.press("Enter");

  await expect(dialog.getByText("商品を探しています…")).toBeVisible();
  await expect(sendButton).toBeDisabled();
  expect(requestCount).toBe(1);
  expect(requestBody).toEqual({ message: userMessage });

  releaseResponse?.();
  await expect(dialog.getByText(recommendation.message)).toBeVisible();
  await expect(dialog.getByText(userMessage)).toBeVisible();
  await expect(dialog.getByTestId("assistant-product-card")).toHaveCount(1);
  await expect(dialog.getByText("¥6,800")).toBeVisible();
  await expect(dialog.getByText(recommendation.products[0]!.recommendationReason)).toBeVisible();
  await expect(page.locator("script", { hasText: "alert(1)" })).toHaveCount(0);

  const addToCart = dialog.getByRole("button", {
    name: "E2Eテスト商品をカートに追加",
  });
  const productLink = dialog.getByRole("link", {
    name: "E2Eテスト商品の商品詳細を見る",
  });
  await productLink.scrollIntoViewIfNeeded();
  await expect(addToCart).toBeEnabled();
  await expect(productLink).toHaveAttribute("href", "/products/e2e-test-product");
  await captureReviewScreenshot(page, "desktop-recommendation-result");
  await addToCart.click();
  await expect(page.getByText("カートに追加しました", { exact: true })).toBeVisible();
  await expect(dialog.getByText("カートに追加しました。", { exact: true })).toBeVisible();

  await productLink.click();
  await expect(page).toHaveURL(/\/products\/e2e-test-product$/);
  await expect(dialog).toBeHidden();
});

test("assistant displays empty, 503, 429, and malformed response states", async ({ page }) => {
  const cases = [
    {
      name: "empty",
      response: {
        status: 200,
        body: {
          success: true,
          data: {
            message: "条件に合う商品はありませんでした。",
            products: [],
          },
        },
      },
      expected: "条件に合う商品が見つかりませんでした。",
      retry: false,
    },
    {
      name: "unavailable",
      response: {
        status: 503,
        body: {
          success: false,
          code: "AI_PROVIDER_UNAVAILABLE",
          message: "provider details",
        },
      },
      expected: "AIアシスタントへの接続に失敗しました。",
      retry: true,
    },
    {
      name: "rate-limit",
      response: {
        status: 429,
        body: {
          success: false,
          code: "RATE_LIMITED",
          message: "rate details",
        },
      },
      expected: "リクエストが多すぎます。",
      retry: true,
    },
    {
      name: "malformed",
      response: {
        status: 200,
        body: {
          success: true,
          data: { message: "壊れた応答", products: [{ id: "not-grounded" }] },
        },
      },
      expected: "商品情報を正しく読み取れませんでした。",
      retry: true,
    },
  ];

  for (const item of cases) {
    await test.step(item.name, async () => {
      await page.unroute("**/api/ai/shopping");
      await page.route("**/api/ai/shopping", (route) =>
        fulfillJson(route, item.response.body, item.response.status),
      );
      await page.goto("/");
      const { dialog } = await openAssistant(page);
      const input = dialog.getByRole("textbox", { name: "商品のご希望" });
      await input.fill("100円以内の商品を探して");
      await input.press("Enter");
      await expect(dialog.getByText(item.expected, { exact: false })).toBeVisible();

      if (item.retry) {
        await expect(dialog.getByRole("button", { name: "もう一度試す" })).toBeVisible();
      } else {
        await expect(dialog.getByRole("button", { name: "もう一度試す" })).toHaveCount(0);
      }
    });
  }
});

test("mobile assistant uses a full-width panel without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route("**/api/ai/shopping", (route) =>
    fulfillJson(route, { success: true, data: recommendation }),
  );

  await page.goto("/");
  const { dialog } = await openAssistant(page);
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBe(0);
  expect(box!.width).toBe(375);

  const input = dialog.getByRole("textbox", { name: "商品のご希望" });
  await input.fill("デスク周りで使えるおすすめの商品はありますか？");
  await input.press("Enter");

  await expect(dialog.getByTestId("assistant-product-card")).toBeVisible();
  const productLink = dialog.getByRole("link", {
    name: "E2Eテスト商品の商品詳細を見る",
  });
  await productLink.scrollIntoViewIfNeeded();
  await expect(productLink).toBeVisible();
  await expect(dialog.getByRole("button", { name: "E2Eテスト商品をカートに追加" })).toBeVisible();
  await captureReviewScreenshot(page, "mobile-recommendation-result");

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
