import assert from "node:assert/strict";
import test from "node:test";
import { cartMatchesCheckoutConfirmation } from "@/lib/checkout/cart";
import { toCheckoutOrder } from "@/lib/checkout/dto";
import { createCheckoutOrderSchema } from "@/lib/validations/checkout";
import type { CreateCheckoutOrderInput } from "@/lib/validations/checkout";
import { getValidationErrors } from "@/lib/validations/errors";
import type { ShoppingCart } from "@/types/cart";

const productId = "507f1f77bcf86cd799439011";
const validInput: CreateCheckoutOrderInput = {
  shippingAddress: {
    fullName: "  Test Customer  ",
    phone: "+81 90 1234 5678",
    line1: "1-2-3 Ginza",
    line2: "",
    city: "Chuo-ku",
    state: "Tokyo",
    postalCode: "104-0061",
    country: "jp",
  },
  paymentMethod: "stripe",
  saveAddress: true,
  confirmOrder: true,
  idempotencyKey: "83dd6fe4-6f5d-48a4-8e15-5d3ff0bccfd4",
  expectedItems: [{ productId, quantity: 2, unitPrice: 21500, currency: "jpy" }],
};

const cart: ShoppingCart = {
  items: [
    {
      product: {
        id: productId,
        name: "Stone Table Lamp",
        slug: "stone-table-lamp",
        price: 21500,
        currency: "jpy",
        image: null,
        stock: 8,
      },
      quantity: 2,
      subtotal: 43000,
    },
  ],
  itemCount: 1,
  totalQuantity: 2,
  totals: [{ currency: "jpy", amount: 43000 }],
  adjustments: [],
};

test("checkout validation normalizes addresses and requires explicit confirmation", () => {
  const parsed = createCheckoutOrderSchema.safeParse(validInput);

  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(parsed.data.shippingAddress.fullName, "Test Customer");
  assert.equal(parsed.data.shippingAddress.country, "JP");
  assert.equal(
    createCheckoutOrderSchema.safeParse({ ...validInput, confirmOrder: false }).success,
    false,
  );
  assert.equal(
    createCheckoutOrderSchema.safeParse({
      ...validInput,
      shippingAddress: { ...validInput.shippingAddress, phone: "alert()" },
    }).success,
    false,
  );
  assert.equal(
    createCheckoutOrderSchema.safeParse({ ...validInput, totalAmount: 1 }).success,
    false,
  );
});

test("validation details preserve nested checkout field paths", () => {
  const parsed = createCheckoutOrderSchema.safeParse({
    ...validInput,
    shippingAddress: { ...validInput.shippingAddress, fullName: "" },
  });

  assert.equal(parsed.success, false);
  if (parsed.success) return;
  const details = getValidationErrors(parsed.error);
  assert.ok(details["shippingAddress.fullName"]?.length);
});

test("checkout confirmation detects quantity, price, currency, and inventory adjustments", () => {
  assert.equal(cartMatchesCheckoutConfirmation(cart, validInput.expectedItems), true);
  assert.equal(
    cartMatchesCheckoutConfirmation(cart, [{ ...validInput.expectedItems[0]!, unitPrice: 1 }]),
    false,
  );
  assert.equal(
    cartMatchesCheckoutConfirmation(
      {
        ...cart,
        adjustments: [{ productId, code: "QUANTITY_REDUCED", fromQuantity: 3, toQuantity: 2 }],
      },
      validInput.expectedItems,
    ),
    false,
  );
});

test("checkout order DTO exposes snapshots without internal idempotency fields", () => {
  const order = toCheckoutOrder({
    _id: "507f1f77bcf86cd799439012",
    items: [
      {
        productId,
        name: "Stone Table Lamp",
        unitPrice: 21500,
        quantity: 2,
        subtotal: 43000,
      },
    ],
    totalAmount: 43000,
    currency: "jpy",
    paymentMethod: "stripe",
    paymentStatus: "pending",
    orderStatus: "pending",
    shippingAddress: { ...validInput.shippingAddress, country: "JP" },
    checkoutKey: validInput.idempotencyKey,
    cartVersion: new Date(),
    paidAt: new Date("2026-08-27T00:05:00.000Z"),
    createdAt: new Date("2026-08-27T00:00:00.000Z"),
  });

  assert.equal(order.id, "507f1f77bcf86cd799439012");
  assert.equal(order.totalAmount, 43000);
  assert.equal(order.shippingAddress.line2, null);
  assert.equal(order.paidAt, "2026-08-27T00:05:00.000Z");
  assert.equal("checkoutKey" in order, false);
});
