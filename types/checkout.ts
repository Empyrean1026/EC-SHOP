import type { CurrencyCode, OrderStatus, PaymentMethod, PaymentStatus } from "@/models";
import type { ShoppingCart } from "@/types/cart";

export type CheckoutAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
};

export type CheckoutOrderItem = {
  productId: string;
  name: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type CheckoutOrder = {
  id: string;
  items: CheckoutOrderItem[];
  totalAmount: number;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress: CheckoutAddress;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type CheckoutPageData = {
  cart: ShoppingCart;
  defaultAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

export type CreateCheckoutOrderResult = {
  order: CheckoutOrder;
  created: boolean;
  cartCleared: boolean;
};
