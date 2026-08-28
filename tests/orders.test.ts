import assert from "node:assert/strict";
import test from "node:test";
import { OrderModel } from "@/models";
import { toOrderDetail, toOrderHistoryItem } from "@/lib/orders/dto";
import {
  legacyCompatibleOrderStatusFilter,
  normalizeOrderStatus,
  ORDER_PROGRESS_STATUSES,
} from "@/lib/orders/status";
import { buildOrderHistoryUrl } from "@/lib/orders/url";
import { orderListQuerySchema } from "@/lib/validations/order";
import { ORDER_STATUSES } from "@/models/constants";

const orderDocument = {
  _id: "507f1f77bcf86cd799439088",
  items: [
    {
      productId: "507f1f77bcf86cd799439089",
      name: "Synthetic Lamp",
      unitPrice: 43000,
      quantity: 2,
      subtotal: 86000,
    },
  ],
  totalAmount: 86000,
  currency: "jpy",
  paymentMethod: "stripe",
  paymentStatus: "paid",
  orderStatus: "confirmed",
  shippingAddress: {
    fullName: "Order Customer",
    phone: "+81 90 0000 0000",
    line1: "1-2-3 Test",
    city: "Tokyo",
    postalCode: "100-0001",
    country: "JP",
  },
  stripePaymentIntentId: "pi_internal",
  checkoutKey: "internal-key",
  paidAt: new Date("2026-08-27T03:27:32.000Z"),
  createdAt: new Date("2026-08-27T03:20:00.000Z"),
  updatedAt: new Date("2026-08-27T03:27:32.000Z"),
};

test("order history query validates paging, status filters, sorting, and unknown fields", () => {
  const defaults = orderListQuerySchema.parse({});
  assert.deepEqual(defaults, { page: 1, limit: 10, sort: "newest" });

  const parsed = orderListQuerySchema.parse({
    page: "2",
    limit: "25",
    status: "shipped",
    paymentStatus: "paid",
    sort: "oldest",
  });
  assert.equal(parsed.page, 2);
  assert.equal(parsed.status, "shipped");
  assert.equal(orderListQuerySchema.safeParse({ status: "confirmed" }).success, false);
  assert.equal(orderListQuerySchema.safeParse({ admin: "true" }).success, false);
});

test("order lifecycle uses the requested statuses and normalizes legacy documents", () => {
  assert.deepEqual(ORDER_STATUSES, [
    "pending",
    "paid",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ]);
  assert.deepEqual(ORDER_PROGRESS_STATUSES, [
    "pending",
    "paid",
    "processing",
    "shipped",
    "completed",
  ]);
  assert.equal(normalizeOrderStatus("confirmed"), "paid");
  assert.equal(normalizeOrderStatus("delivered"), "completed");
  assert.deepEqual(legacyCompatibleOrderStatusFilter("paid"), ["paid", "confirmed"]);
});

test("order DTOs expose user-safe history and detail snapshots", () => {
  const detail = toOrderDetail(orderDocument);
  const history = toOrderHistoryItem(orderDocument);

  assert.equal(detail.orderStatus, "paid");
  assert.equal(detail.totalQuantity, 2);
  assert.equal(detail.shippingAddress.line2, null);
  assert.equal(detail.paidAt, "2026-08-27T03:27:32.000Z");
  assert.equal("stripePaymentIntentId" in detail, false);
  assert.equal("checkoutKey" in detail, false);
  assert.equal(history.items[0]?.name, "Synthetic Lamp");
  assert.equal("shippingAddress" in history, false);
});

test("order history URLs preserve filters while changing pages", () => {
  const query = orderListQuerySchema.parse({
    page: 2,
    status: "paid",
    paymentStatus: "paid",
    sort: "oldest",
  });
  const url = buildOrderHistoryUrl(query, { page: 3 });

  assert.match(url, /page=3/);
  assert.match(url, /status=paid/);
  assert.match(url, /paymentStatus=paid/);
  assert.match(url, /sort=oldest/);
});

test("Order declares compound indexes for user and admin status pagination", () => {
  const indexes = OrderModel.schema.indexes().map(([fields]) => fields);

  assert.equal(
    indexes.some(
      (fields) => fields.userId === 1 && fields.orderStatus === 1 && fields.createdAt === -1,
    ),
    true,
  );
  assert.equal(
    indexes.some(
      (fields) => fields.orderStatus === 1 && fields.paymentStatus === 1 && fields.createdAt === -1,
    ),
    true,
  );
});
