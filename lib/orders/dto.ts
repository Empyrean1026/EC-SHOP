import { normalizeOrderStatus } from "@/lib/orders/status";
import type { CheckoutAddress, CheckoutOrderItem } from "@/types/checkout";
import type { OrderDetail, OrderHistoryItem } from "@/types/order";

type UnknownRecord = Record<string, unknown>;

function stringId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toString" in value) return String(value);
  return "";
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function dateString(value: unknown): string {
  return new Date(value as string | number | Date).toISOString();
}

function nullableDateString(value: unknown): string | null {
  return value ? dateString(value) : null;
}

function toAddress(value: unknown): CheckoutAddress {
  const address = value as UnknownRecord;
  return {
    fullName: String(address.fullName),
    phone: String(address.phone),
    line1: String(address.line1),
    line2: nullableString(address.line2),
    city: String(address.city),
    state: nullableString(address.state),
    postalCode: String(address.postalCode),
    country: String(address.country),
  };
}

function toOrderItem(value: unknown): CheckoutOrderItem {
  const item = value as UnknownRecord;
  return {
    productId: stringId(item.productId),
    name: String(item.name),
    image: nullableString(item.image),
    unitPrice: Number(item.unitPrice),
    quantity: Number(item.quantity),
    subtotal: Number(item.subtotal),
  };
}

export function toOrderDetail(value: unknown): OrderDetail {
  const order = value as UnknownRecord;
  const items = Array.isArray(order.items) ? order.items.map(toOrderItem) : [];
  return {
    id: stringId(order._id),
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: Number(order.totalAmount),
    currency: order.currency as OrderDetail["currency"],
    paymentMethod: order.paymentMethod as OrderDetail["paymentMethod"],
    paymentStatus: order.paymentStatus as OrderDetail["paymentStatus"],
    orderStatus: normalizeOrderStatus(order.orderStatus),
    shippingAddress: toAddress(order.shippingAddress),
    paidAt: nullableDateString(order.paidAt),
    createdAt: dateString(order.createdAt),
    updatedAt: dateString(order.updatedAt),
  };
}

export function toOrderHistoryItem(value: unknown): OrderHistoryItem {
  const order = toOrderDetail(value);
  return {
    id: order.id,
    items: order.items.map(({ productId, name, image, quantity }) => ({
      productId,
      name,
      image,
      quantity,
    })),
    itemCount: order.items.length,
    totalQuantity: order.totalQuantity,
    totalAmount: order.totalAmount,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    paidAt: order.paidAt,
  };
}
