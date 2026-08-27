import assert from "node:assert/strict";
import test from "node:test";
import { canAdminTransitionOrder, getAllowedAdminOrderTransitions } from "@/lib/admin/order-status";
import { buildAdminPageUrl } from "@/lib/admin/url";
import {
  adminOrderListQuerySchema,
  adminProductListQuerySchema,
  adminUserListQuerySchema,
  updateAdminOrderStatusSchema,
  updateAdminStockSchema,
} from "@/lib/validations/admin";

test("admin list queries coerce paging and reject unknown controls", () => {
  const products = adminProductListQuerySchema.safeParse({
    q: " lamp ",
    status: "inactive",
    stock: "low",
    page: "2",
    limit: "25",
    sort: "stock_asc",
  });
  const orders = adminOrderListQuerySchema.safeParse({ status: "paid", paymentStatus: "paid" });
  const users = adminUserListQuerySchema.safeParse({ role: "admin", unexpected: "true" });

  assert.equal(products.success, true);
  assert.equal(products.success ? products.data.q : null, "lamp");
  assert.equal(products.success ? products.data.page : null, 2);
  assert.equal(orders.success, true);
  assert.equal(users.success, false);
});

test("admin mutations accept only strict stock and public order statuses", () => {
  assert.equal(updateAdminStockSchema.safeParse({ stock: 12 }).success, true);
  assert.equal(updateAdminStockSchema.safeParse({ stock: -1 }).success, false);
  assert.equal(
    updateAdminStockSchema.safeParse({ stock: 2, productId: "injected" }).success,
    false,
  );
  assert.equal(updateAdminOrderStatusSchema.safeParse({ orderStatus: "shipped" }).success, true);
  assert.equal(updateAdminOrderStatusSchema.safeParse({ orderStatus: "refunded" }).success, false);
});

test("fulfillment state machine blocks skips, reversals, and unpaid Stripe processing", () => {
  assert.deepEqual(getAllowedAdminOrderTransitions("paid", "paid", "stripe"), ["processing"]);
  assert.deepEqual(getAllowedAdminOrderTransitions("pending", "pending", "stripe"), ["cancelled"]);
  assert.deepEqual(getAllowedAdminOrderTransitions("pending", "pending", "cash_on_delivery"), [
    "processing",
    "cancelled",
  ]);
  assert.equal(canAdminTransitionOrder("processing", "shipped", "paid", "stripe"), true);
  assert.equal(canAdminTransitionOrder("processing", "completed", "paid", "stripe"), false);
  assert.equal(canAdminTransitionOrder("completed", "processing", "paid", "stripe"), false);
});

test("admin pagination URLs retain filters and omit default all values", () => {
  assert.equal(
    buildAdminPageUrl(
      "/admin/products",
      { q: "lamp", status: "all", stock: "low", sort: "stock_asc", limit: 20 },
      3,
    ),
    "/admin/products?q=lamp&stock=low&sort=stock_asc&limit=20&page=3",
  );
});
