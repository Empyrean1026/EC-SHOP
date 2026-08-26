export const USER_ROLES = ["customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CURRENCY_CODES = ["jpy", "usd", "cny"] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "paid",
  "failed",
  "partially_refunded",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
