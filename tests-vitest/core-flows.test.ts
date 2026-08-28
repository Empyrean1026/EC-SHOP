import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { canAdminTransitionOrder } from "@/lib/admin/order-status";
import { createCartStore } from "@/store/cart-store";
import { createCheckoutOrderSchema } from "@/lib/validations/checkout";
import { productListQuerySchema } from "@/lib/validations/product";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { stripePaymentTransition } from "@/lib/stripe/payment-intent";

describe("authentication inputs", () => {
  it("accepts a strong registration and normalizes login email", () => {
    const registration = registerSchema.parse({
      name: "测试用户",
      email: " TEST@EXAMPLE.COM ",
      password: "TestPass123",
      confirmPassword: "TestPass123",
    });
    const login = loginSchema.parse({ email: " TEST@EXAMPLE.COM ", password: "TestPass123" });

    expect(registration.email).toBe("test@example.com");
    expect(login.email).toBe("test@example.com");
  });

  it("rejects password confirmation mismatches", () => {
    expect(
      registerSchema.safeParse({
        name: "测试用户",
        email: "test@example.com",
        password: "TestPass123",
        confirmPassword: "Different123",
      }).success,
    ).toBe(false);
  });
});

describe("product, cart, and checkout", () => {
  const product = {
    id: "507f1f77bcf86cd799439011",
    name: "测试商品",
    slug: "test-product",
    price: 6800,
    currency: "jpy" as const,
    image: null,
    stock: 3,
  };

  it("bounds product API pagination and filters", () => {
    const query = productListQuerySchema.parse({ page: "2", limit: "20", inStock: "true" });

    expect(query).toMatchObject({ page: 2, limit: 20, inStock: true });
    expect(productListQuerySchema.safeParse({ limit: "5000" }).success).toBe(false);
  });

  it("maintains trusted cart totals and stock limits", () => {
    const store = createCartStore();

    expect(store.getState().addLocalItem(product, 2)).toEqual({ success: true });
    expect(store.getState().totals).toEqual([{ currency: "jpy", amount: 13_600 }]);
    expect(store.getState().addLocalItem(product, 2).success).toBe(false);
  });

  it("requires a confirmed, strict checkout snapshot", () => {
    const result = createCheckoutOrderSchema.safeParse({
      shippingAddress: {
        fullName: "测试用户",
        phone: "+81 90 1234 5678",
        line1: "1-2-3 Test",
        line2: "",
        city: "Tokyo",
        state: "Tokyo",
        postalCode: "100-0001",
        country: "jp",
      },
      paymentMethod: "cash_on_delivery",
      saveAddress: false,
      confirmOrder: true,
      idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
      expectedItems: [
        { productId: product.id, quantity: 1, unitPrice: product.price, currency: "jpy" },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.shippingAddress.country).toBe("JP");
  });
});

describe("Stripe and order transitions", () => {
  it("only confirms a validated successful PaymentIntent", () => {
    const paymentIntent = (amountReceived: number) =>
      ({ amount: 6800, amount_received: amountReceived }) as Stripe.PaymentIntent;
    const transition = stripePaymentTransition(
      "payment_intent.succeeded",
      paymentIntent(6800),
      1_788_000_000,
    );

    expect(transition).toMatchObject({ paymentStatus: "paid", confirmOrder: true });
    expect(stripePaymentTransition("payment_intent.succeeded", paymentIntent(0), 1)).toBe(null);
  });

  it("blocks unpaid Stripe orders from fulfillment", () => {
    expect(canAdminTransitionOrder("paid", "processing", "paid", "stripe")).toBe(true);
    expect(canAdminTransitionOrder("paid", "processing", "pending", "stripe")).toBe(false);
  });
});
