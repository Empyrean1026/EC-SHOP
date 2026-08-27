import type { CurrencyCode, OrderStatus, PaymentMethod, PaymentStatus } from "@/models";
import type { CheckoutAddress, CheckoutOrderItem } from "@/types/checkout";
import type { PaginationMeta } from "@/types/product";

export type OrderHistoryItem = {
  id: string;
  items: Pick<CheckoutOrderItem, "productId" | "name" | "image" | "quantity">[];
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
};

export type OrderDetail = {
  id: string;
  items: CheckoutOrderItem[];
  totalQuantity: number;
  totalAmount: number;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress: CheckoutAddress;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderListResult = {
  items: OrderHistoryItem[];
  pagination: PaginationMeta;
};
