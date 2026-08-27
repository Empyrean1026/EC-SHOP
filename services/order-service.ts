import "server-only";

import { Types } from "mongoose";
import { toOrderDetail, toOrderHistoryItem } from "@/lib/orders/dto";
import { legacyCompatibleOrderStatusFilter } from "@/lib/orders/status";
import { connectToDatabase } from "@/lib/mongodb";
import type { OrderListQuery } from "@/lib/validations/order";
import { OrderModel } from "@/models";
import type { OrderDetail, OrderListResult } from "@/types/order";

const ORDER_SORTS: Record<OrderListQuery["sort"], Record<string, 1 | -1>> = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
};

export async function listUserOrders(
  userId: string,
  query: OrderListQuery,
): Promise<OrderListResult> {
  await connectToDatabase();

  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
  if (query.status) {
    const compatible = legacyCompatibleOrderStatusFilter(query.status);
    filter.orderStatus = Array.isArray(compatible) ? { $in: compatible } : compatible;
  }
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

  const skip = (query.page - 1) * query.limit;
  const [documents, total] = await Promise.all([
    OrderModel.find(filter).sort(ORDER_SORTS[query.sort]).skip(skip).limit(query.limit).lean(),
    OrderModel.countDocuments(filter),
  ]);
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

  return {
    items: documents.map(toOrderHistoryItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasPreviousPage: query.page > 1 && totalPages > 0,
      hasNextPage: query.page < totalPages,
    },
  };
}

export async function getUserOrder(userId: string, orderId: string): Promise<OrderDetail | null> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(orderId)) return null;

  const order = await OrderModel.findOne({ _id: orderId, userId }).lean();
  return order ? toOrderDetail(order) : null;
}
