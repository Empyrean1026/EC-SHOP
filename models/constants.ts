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

export const PAYMENT_METHODS = ["stripe", "cash_on_delivery"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
