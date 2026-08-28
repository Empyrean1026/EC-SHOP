import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
} from "@playwright/test";

const ORIGIN = "http://127.0.0.1:3100";
const PRODUCT_ID = "507f1f77bcf86cd799439011";

async function getCsrfToken(request: APIRequestContext): Promise<string> {
  const response = await request.get("/api/auth/csrf");
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { success: boolean; data: { csrfToken: string } };
  expect(body.success).toBe(true);
  return body.data.csrfToken;
}

function mutationHeaders(csrfToken: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,
    Origin: ORIGIN,
    "Sec-Fetch-Site": "same-origin",
  };
}

test("主要APIで新規登録からカート、注文までの一連の処理が完了する", async ({
  request,
}, testInfo) => {
  const email = `api.e2e.${testInfo.retry}@example.com`;

  await test.step("商品一覧と商品詳細を取得できる", async () => {
    const listResponse = await request.get("/api/products?category=e2e-products&limit=10");
    expect(listResponse.status()).toBe(200);
    const list = await listResponse.json();
    expect(list).toMatchObject({ success: true });
    expect(list.data.items).toHaveLength(1);
    expect(list.data.items[0]).toMatchObject({ id: PRODUCT_ID, price: 6800, stock: 10 });

    const detailResponse = await request.get(`/api/products/${PRODUCT_ID}`);
    expect(detailResponse.status()).toBe(200);
    const detail = await detailResponse.json();
    expect(detail.data.product).toMatchObject({ id: PRODUCT_ID, name: "E2Eテスト商品" });
  });

  await test.step("未ログインのユーザーは商品を登録できない", async () => {
    const anonymous = await playwrightRequest.newContext({ baseURL: ORIGIN });
    try {
      const response = await anonymous.post("/api/products", { data: {} });
      expect(response.status()).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        code: "UNAUTHENTICATED",
      });
    } finally {
      await anonymous.dispose();
    }
  });

  await test.step("新規登録、誤ったパスワード、正しいログインを検証する", async () => {
    let csrfToken = await getCsrfToken(request);
    const registration = await request.post("/api/auth/register", {
      headers: mutationHeaders(csrfToken),
      data: {
        name: "APIテストユーザー",
        email,
        password: "TestPass123",
        confirmPassword: "TestPass123",
      },
    });
    expect(registration.status()).toBe(201);
    await expect(registration.json()).resolves.toMatchObject({
      success: true,
      data: { user: { email, role: "customer" } },
    });

    csrfToken = await getCsrfToken(request);
    const wrongPassword = await request.post("/api/auth/login", {
      headers: mutationHeaders(csrfToken),
      data: { email, password: "WrongPass123" },
    });
    expect(wrongPassword.status()).toBe(401);
    await expect(wrongPassword.json()).resolves.toMatchObject({ success: false });

    csrfToken = await getCsrfToken(request);
    const login = await request.post("/api/auth/login", {
      headers: mutationHeaders(csrfToken),
      data: { email, password: "TestPass123" },
    });
    expect(login.status()).toBe(200);
    await expect(login.json()).resolves.toMatchObject({
      success: true,
      data: { user: { email } },
    });
  });

  await test.step("カートをサーバー側の価格と在庫で計算する", async () => {
    const csrfToken = await getCsrfToken(request);
    const added = await request.post("/api/cart/items", {
      headers: mutationHeaders(csrfToken),
      data: { productId: PRODUCT_ID, quantity: 2 },
    });
    expect(added.status()).toBe(200);
    const addedBody = await added.json();
    expect(addedBody.data.cart).toMatchObject({
      itemCount: 1,
      totalQuantity: 2,
      totals: [{ currency: "jpy", amount: 13_600 }],
    });

    const cart = await request.get("/api/cart");
    expect(cart.status()).toBe(200);
    await expect(cart.json()).resolves.toMatchObject({
      success: true,
      data: { cart: { totalQuantity: 2 } },
    });
  });

  let orderId = "";
  await test.step("購入手続きで注文を作成しカートを空にする", async () => {
    const csrfToken = await getCsrfToken(request);
    const checkout = await request.post("/api/orders", {
      headers: mutationHeaders(csrfToken),
      data: {
        shippingAddress: {
          fullName: "APIテストユーザー",
          phone: "+81 90 1234 5678",
          line1: "1-2-3 Test",
          line2: "",
          city: "Tokyo",
          state: "Tokyo",
          postalCode: "100-0001",
          country: "JP",
        },
        paymentMethod: "cash_on_delivery",
        saveAddress: false,
        confirmOrder: true,
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
        expectedItems: [{ productId: PRODUCT_ID, quantity: 2, unitPrice: 6800, currency: "jpy" }],
      },
    });
    expect(checkout.status()).toBe(201);
    const checkoutBody = await checkout.json();
    expect(checkoutBody.data).toMatchObject({
      created: true,
      cartCleared: true,
      order: {
        totalAmount: 13_600,
        paymentStatus: "pending",
        orderStatus: "pending",
      },
    });
    orderId = checkoutBody.data.order.id;
    expect(orderId).toMatch(/^[a-f\d]{24}$/);

    const cart = await request.get("/api/cart");
    await expect(cart.json()).resolves.toMatchObject({
      data: { cart: { itemCount: 0, totalQuantity: 0 } },
    });
  });

  await test.step("注文履歴と注文詳細が一致する", async () => {
    const history = await request.get("/api/orders");
    expect(history.status()).toBe(200);
    const historyBody = await history.json();
    expect(historyBody.data.pagination.total).toBe(1);
    expect(historyBody.data.items[0]).toMatchObject({ id: orderId, totalAmount: 13_600 });

    const detail = await request.get(`/api/orders/${orderId}`);
    expect(detail.status()).toBe(200);
    await expect(detail.json()).resolves.toMatchObject({
      success: true,
      data: { id: orderId, paymentStatus: "pending", orderStatus: "pending" },
    });
  });

  await test.step("支払いAPIがStripe以外の注文を拒否する", async () => {
    const csrfToken = await getCsrfToken(request);
    const response = await request.post(`/api/orders/${orderId}/payment-intent`, {
      headers: mutationHeaders(csrfToken),
    });
    expect(response.status()).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: "PAYMENT_METHOD_NOT_SUPPORTED",
    });
  });

  await test.step("Stripe Webhookで署名検証を必須とする", async () => {
    const response = await request.post("/api/webhooks/stripe", {
      headers: { "Content-Type": "application/json", "stripe-signature": "invalid" },
      data: {},
    });
    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: "INVALID_STRIPE_SIGNATURE",
    });
  });
});
