import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import { CartModel, CategoryModel, OrderModel, ProductModel, UserModel } from "@/models";

const passwordHash = `$2b$12$${"a".repeat(53)}`;
const address = {
  fullName: "Test Customer",
  phone: "+81 90 1234 5678",
  line1: "1-2-3 Ginza",
  city: "Chuo-ku",
  state: "Tokyo",
  postalCode: "104-0061",
  country: "jp",
};

test("User model normalizes identity fields and protects password hashes", async () => {
  const user = new UserModel({
    name: "  Test Customer  ",
    email: "  CUSTOMER@EXAMPLE.COM  ",
    passwordHash,
    address,
  });

  await user.validate();

  assert.equal(user.name, "Test Customer");
  assert.equal(user.email, "customer@example.com");
  assert.equal(user.role, "customer");
  assert.equal(user.address?.country, "JP");

  const serialized = user.toJSON() as Record<string, unknown>;
  assert.equal(typeof serialized.id, "string");
  assert.equal(serialized._id, undefined);
  assert.equal(serialized.passwordHash, undefined);
});

test("User model rejects malformed email addresses", async () => {
  const user = new UserModel({
    name: "Test Customer",
    email: "not-an-email",
    passwordHash,
  });

  await assert.rejects(user.validate(), /Email must be valid/);
});

test("Category and Product models enforce slugs, money, inventory, and ratings", async () => {
  const category = new CategoryModel({
    name: "Home Objects",
    slug: "home-objects",
  });

  await category.validate();

  const product = new ProductModel({
    name: "Stone Table Lamp",
    slug: "stone-table-lamp",
    description: "A compact stone lamp for quiet interiors.",
    price: 21500,
    category: category._id,
    images: ["https://example.com/lamp.jpg"],
    stock: 8,
    rating: 4.8,
    reviewCount: 24,
    salesCount: 158,
  });

  await product.validate();

  assert.equal(product.currency, "jpy");
  assert.equal(product.isActive, true);
  assert.equal(product.salesCount, 158);

  product.price = 21.5;
  await assert.rejects(product.validate(), /non-negative safe integer/);

  const invalidCategory = new CategoryModel({
    name: "Invalid Category",
    slug: "invalid category",
  });
  await assert.rejects(invalidCategory.validate(), /lowercase letters, numbers, and hyphens/);
});

test("Order model stores item and address snapshots and derives item subtotals", async () => {
  const userId = new Types.ObjectId();
  const productId = new Types.ObjectId();
  const order = new OrderModel({
    userId,
    items: [
      {
        productId,
        name: "Stone Table Lamp",
        image: "https://example.com/lamp.jpg",
        unitPrice: 21500,
        quantity: 2,
      },
    ],
    totalAmount: 43000,
    paymentMethod: "stripe",
    shippingAddress: address,
    checkoutKey: "83dd6fe4-6f5d-48a4-8e15-5d3ff0bccfd4",
    cartVersion: new Date("2026-08-27T00:00:00.000Z"),
    stripePaymentErrorCode: "card_declined",
    stripeLastEventId: "evt_test_123",
    stripeLastEventAt: new Date("2026-08-27T00:01:00.000Z"),
  });

  await order.validate();

  assert.equal(order.items[0]?.subtotal, 43000);
  assert.equal(order.paymentStatus, "pending");
  assert.equal(order.orderStatus, "pending");
  assert.equal(order.paymentMethod, "stripe");
  assert.equal(order.shippingAddress.country, "JP");

  const serialized = order.toJSON() as Record<string, unknown>;
  assert.equal(serialized.checkoutKey, undefined);
  assert.equal(serialized.cartVersion, undefined);
  assert.equal(serialized.stripePaymentErrorCode, undefined);
  assert.equal(serialized.stripeLastEventId, undefined);
  assert.equal(serialized.stripeLastEventAt, undefined);
});

test("Cart model allows one cart per user and rejects duplicate products", async () => {
  const productId = new Types.ObjectId();
  const cart = new CartModel({
    userId: new Types.ObjectId(),
    items: [
      { productId, quantity: 1 },
      { productId, quantity: 2 },
    ],
  });

  await assert.rejects(cart.validate(), /only appear once/);

  const userIndex = UserModel.schema.indexes().find(([fields]) => Object.hasOwn(fields, "email"));
  const cartIndex = CartModel.schema.indexes().find(([fields]) => Object.hasOwn(fields, "userId"));
  const checkoutKeyIndex = OrderModel.schema
    .indexes()
    .find(([fields]) => Object.hasOwn(fields, "checkoutKey"));
  const cartVersionIndex = OrderModel.schema
    .indexes()
    .find(([fields]) => Object.hasOwn(fields, "cartVersion"));

  assert.equal(userIndex?.[1].unique, true);
  assert.equal(cartIndex?.[1].unique, true);
  assert.equal(checkoutKeyIndex?.[1].unique, true);
  assert.equal(cartVersionIndex?.[1].unique, true);
});
