import type { CheckoutAddress, CheckoutOrder, CheckoutOrderItem } from "@/types/checkout";

type UnknownRecord = Record<string, unknown>;

function stringId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toString" in value) return String(value);
  return "";
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
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

export function toCheckoutOrder(value: unknown): CheckoutOrder {
  const order = value as UnknownRecord;

  return {
    id: stringId(order._id),
    items: Array.isArray(order.items) ? order.items.map(toOrderItem) : [],
    totalAmount: Number(order.totalAmount),
    currency: order.currency as CheckoutOrder["currency"],
    paymentMethod: order.paymentMethod as CheckoutOrder["paymentMethod"],
    paymentStatus: order.paymentStatus as CheckoutOrder["paymentStatus"],
    orderStatus: order.orderStatus as CheckoutOrder["orderStatus"],
    shippingAddress: toAddress(order.shippingAddress),
    stripePaymentIntentId: nullableString(order.stripePaymentIntentId),
    createdAt: new Date(order.createdAt as string | number | Date).toISOString(),
  };
}
