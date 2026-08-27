import "server-only";

import { Types, type QueryFilter } from "mongoose";
import { canAdminTransitionOrder } from "@/lib/admin/order-status";
import { connectToDatabase } from "@/lib/mongodb";
import { toOrderDetail, toOrderHistoryItem } from "@/lib/orders/dto";
import { legacyCompatibleOrderStatusFilter, normalizeOrderStatus } from "@/lib/orders/status";
import { toCatalogProduct } from "@/lib/products/dto";
import { escapeRegularExpression } from "@/lib/products/search";
import type {
  AdminOrderListQuery,
  AdminProductListQuery,
  AdminUserListQuery,
} from "@/lib/validations/admin";
import { OrderModel, ProductModel, UserModel, type OrderStatus, type Product } from "@/models";
import type {
  AdminCustomerSummary,
  AdminDashboardSummary,
  AdminOrderDetail,
  AdminOrderItem,
  AdminOrderListResult,
  AdminProductListResult,
  AdminUserItem,
  AdminUserListResult,
} from "@/types/admin";
import type { CatalogProduct, PaginationMeta } from "@/types/product";

type PopulatedCustomer = { _id: unknown; name: string; email: string };

function pagination(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
    hasNextPage: page < totalPages,
  };
}

function toCustomer(value: unknown): AdminCustomerSummary | null {
  if (!value || typeof value !== "object" || !("name" in value) || !("email" in value)) {
    return null;
  }
  const customer = value as PopulatedCustomer;
  return { id: String(customer._id), name: String(customer.name), email: String(customer.email) };
}

function toAdminOrderItem(value: unknown): AdminOrderItem {
  const source = value as Record<string, unknown>;
  return { ...toOrderHistoryItem(source), customer: toCustomer(source.userId) };
}

function toAdminOrderDetail(value: unknown): AdminOrderDetail {
  const source = value as Record<string, unknown>;
  return { ...toOrderDetail(source), customer: toCustomer(source.userId) };
}

export class AdminOrderNotFoundError extends Error {
  constructor() {
    super("Order does not exist");
    this.name = "AdminOrderNotFoundError";
  }
}

export class InvalidOrderTransitionError extends Error {
  constructor() {
    super("Order status transition is not allowed");
    this.name = "InvalidOrderTransitionError";
  }
}

export class ConcurrentOrderUpdateError extends Error {
  constructor() {
    super("Order changed during update");
    this.name = "ConcurrentOrderUpdateError";
  }
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  await connectToDatabase();
  const [products, activeProducts, lowStockProducts, orders, openOrders, users] = await Promise.all(
    [
      ProductModel.countDocuments(),
      ProductModel.countDocuments({ isActive: true }),
      ProductModel.countDocuments({ isActive: true, stock: { $lte: 5 } }),
      OrderModel.countDocuments(),
      OrderModel.countDocuments({
        orderStatus: { $in: ["pending", "paid", "processing", "shipped"] },
      }),
      UserModel.countDocuments(),
    ],
  );

  return { products, activeProducts, lowStockProducts, orders, openOrders, users };
}

export async function listAdminProducts(
  query: AdminProductListQuery,
): Promise<AdminProductListResult> {
  await connectToDatabase();
  const filter: QueryFilter<Product> = {};
  if (query.status !== "all") filter.isActive = query.status === "active";
  if (query.stock === "in_stock") filter.stock = { $gt: 5 };
  if (query.stock === "low") filter.stock = { $gte: 1, $lte: 5 };
  if (query.stock === "out_of_stock") filter.stock = 0;
  if (query.q) {
    const expression = new RegExp(escapeRegularExpression(query.q), "i");
    filter.$or = [{ name: expression }, { slug: expression }];
  }

  const sorts: Record<AdminProductListQuery["sort"], Record<string, 1 | -1>> = {
    newest: { createdAt: -1, _id: -1 },
    name: { name: 1, _id: 1 },
    stock_asc: { stock: 1, _id: 1 },
    stock_desc: { stock: -1, _id: -1 },
  };
  const skip = (query.page - 1) * query.limit;
  const [documents, total] = await Promise.all([
    ProductModel.find(filter)
      .populate({ path: "category", select: "_id name slug" })
      .sort(sorts[query.sort])
      .skip(skip)
      .limit(query.limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  return {
    items: documents.map(toCatalogProduct),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function getAdminProduct(productId: string): Promise<CatalogProduct | null> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(productId)) return null;
  const product = await ProductModel.findById(productId)
    .populate({ path: "category", select: "_id name slug" })
    .lean();
  return product ? toCatalogProduct(product) : null;
}

export async function listAdminOrders(query: AdminOrderListQuery): Promise<AdminOrderListResult> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {};
  if (query.status) {
    const compatible = legacyCompatibleOrderStatusFilter(query.status);
    filter.orderStatus = Array.isArray(compatible) ? { $in: compatible } : compatible;
  }
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.q) {
    const customerExpression = new RegExp(escapeRegularExpression(query.q), "i");
    const customers = await UserModel.find({
      $or: [{ name: customerExpression }, { email: customerExpression }],
    })
      .select("_id")
      .limit(100)
      .lean();
    const identities = customers.map((customer) => customer._id);
    if (Types.ObjectId.isValid(query.q)) identities.push(new Types.ObjectId(query.q));
    filter.$or = [
      { userId: { $in: identities } },
      ...(Types.ObjectId.isValid(query.q) ? [{ _id: query.q }] : []),
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const sort =
    query.sort === "oldest"
      ? { createdAt: 1 as const, _id: 1 as const }
      : { createdAt: -1 as const, _id: -1 as const };
  const [documents, total] = await Promise.all([
    OrderModel.find(filter)
      .populate({ path: "userId", select: "_id name email" })
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .lean(),
    OrderModel.countDocuments(filter),
  ]);

  return {
    items: documents.map(toAdminOrderItem),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function getAdminOrder(orderId: string): Promise<AdminOrderDetail | null> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(orderId)) return null;
  const order = await OrderModel.findById(orderId)
    .populate({ path: "userId", select: "_id name email" })
    .lean();
  return order ? toAdminOrderDetail(order) : null;
}

export async function updateAdminOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
): Promise<AdminOrderDetail> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(orderId)) throw new AdminOrderNotFoundError();
  const current = await OrderModel.findById(orderId).lean();
  if (!current) throw new AdminOrderNotFoundError();

  const normalizedCurrent = normalizeOrderStatus(current.orderStatus);
  if (
    !canAdminTransitionOrder(
      normalizedCurrent,
      nextStatus,
      current.paymentStatus,
      current.paymentMethod,
    )
  ) {
    throw new InvalidOrderTransitionError();
  }

  const update: Record<string, unknown> = { orderStatus: nextStatus };
  if (nextStatus === "completed" && current.paymentMethod === "cash_on_delivery") {
    update.paymentStatus = "paid";
    update.paidAt = new Date();
  }

  const order = await OrderModel.findOneAndUpdate(
    { _id: orderId, orderStatus: current.orderStatus, updatedAt: current.updatedAt },
    { $set: update },
    { returnDocument: "after", runValidators: true },
  )
    .populate({ path: "userId", select: "_id name email" })
    .lean();

  if (!order) throw new ConcurrentOrderUpdateError();
  return toAdminOrderDetail(order);
}

export async function listAdminUsers(query: AdminUserListQuery): Promise<AdminUserListResult> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {};
  if (query.role) filter.role = query.role;
  if (query.q) {
    const expression = new RegExp(escapeRegularExpression(query.q), "i");
    filter.$or = [{ name: expression }, { email: expression }];
  }

  const sorts: Record<AdminUserListQuery["sort"], Record<string, 1 | -1>> = {
    newest: { createdAt: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
    name: { name: 1, _id: 1 },
  };
  const skip = (query.page - 1) * query.limit;
  const [documents, total] = await Promise.all([
    UserModel.find(filter)
      .select("_id name email role avatar address createdAt")
      .sort(sorts[query.sort])
      .skip(skip)
      .limit(query.limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);
  const userIds = documents.map((user) => user._id);
  const counts = await OrderModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);
  const orderCountByUser = new Map(counts.map((entry) => [String(entry._id), entry.count]));
  const items: AdminUserItem[] = documents.map((user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? null,
    hasAddress: Boolean(user.address),
    orderCount: orderCountByUser.get(String(user._id)) ?? 0,
    createdAt: user.createdAt.toISOString(),
  }));

  return { items, pagination: pagination(query.page, query.limit, total) };
}
