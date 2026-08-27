import "server-only";

import { Types } from "mongoose";
import { cartMatchesCheckoutConfirmation } from "@/lib/checkout/cart";
import { toCheckoutOrder } from "@/lib/checkout/dto";
import { createRequestId, logServerError } from "@/lib/api/logger";
import { isDuplicateKeyError } from "@/lib/mongodb-errors";
import { connectToDatabase } from "@/lib/mongodb";
import type { CreateCheckoutOrderInput, ShippingAddressInput } from "@/lib/validations/checkout";
import { validateCartLines } from "@/services/cart-service";
import { CartModel, OrderModel, UserModel } from "@/models";
import type { ShoppingCart } from "@/types/cart";
import type { CheckoutPageData, CheckoutOrder, CreateCheckoutOrderResult } from "@/types/checkout";

type StoredCheckoutCart = {
  _id: Types.ObjectId;
  items: Array<{ productId: Types.ObjectId; quantity: number }>;
  updatedAt: Date;
};

export class CheckoutEmptyCartError extends Error {
  constructor() {
    super("Checkout cart is empty");
    this.name = "CheckoutEmptyCartError";
  }
}

export class CheckoutCartChangedError extends Error {
  constructor() {
    super("Checkout cart changed after confirmation");
    this.name = "CheckoutCartChangedError";
  }
}

export class CheckoutCurrencyError extends Error {
  constructor() {
    super("Checkout requires exactly one currency");
    this.name = "CheckoutCurrencyError";
  }
}

export class CheckoutAmountError extends Error {
  constructor() {
    super("Checkout amount is outside the supported safe integer range");
    this.name = "CheckoutAmountError";
  }
}

function normalizedAddress(address: ShippingAddressInput) {
  return {
    ...address,
    line2: address.line2 || undefined,
    state: address.state || undefined,
  };
}

async function findOrderDocumentByCheckoutIdentity(
  userId: string,
  checkoutKey: string,
  cartVersion?: Date,
): Promise<Record<string, unknown> | null> {
  return OrderModel.findOne({
    userId,
    $or: [{ checkoutKey }, ...(cartVersion ? [{ cartVersion }] : [])],
  }).lean() as Promise<Record<string, unknown> | null>;
}

async function saveDefaultAddress(userId: string, address: ShippingAddressInput): Promise<void> {
  try {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { address: normalizedAddress(address) } },
      { runValidators: true },
    );
  } catch (error) {
    logServerError({
      requestId: createRequestId(),
      context: "checkout.save-default-address",
      error,
    });
  }
}

export async function getCheckoutPageData(
  userId: string,
  userName: string,
): Promise<CheckoutPageData> {
  await connectToDatabase();
  const [user, cart] = await Promise.all([
    UserModel.findById(userId).select("name address").lean(),
    validateCartLinesFromUserCart(userId),
  ]);
  const address = user?.address;

  return {
    cart,
    defaultAddress: {
      fullName: address?.fullName ?? user?.name ?? userName,
      phone: address?.phone ?? "",
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      postalCode: address?.postalCode ?? "",
      country: address?.country ?? "JP",
    },
  };
}

async function validateCartLinesFromUserCart(userId: string): Promise<ShoppingCart> {
  const cart = await CartModel.findOne({ userId }).select("items").lean();
  if (!cart) {
    return { items: [], itemCount: 0, totalQuantity: 0, totals: [], adjustments: [] };
  }

  return validateCartLines(
    cart.items.map((item) => ({ productId: item.productId.toString(), quantity: item.quantity })),
  );
}

export async function createCheckoutOrder(
  userId: string,
  input: CreateCheckoutOrderInput,
): Promise<CreateCheckoutOrderResult> {
  await connectToDatabase();

  const existing = await findOrderDocumentByCheckoutIdentity(userId, input.idempotencyKey);
  if (existing) {
    const existingCartVersion = new Date(existing.cartVersion as string | number | Date);
    const clearResult = Number.isNaN(existingCartVersion.getTime())
      ? null
      : await CartModel.updateOne(
          { userId, updatedAt: existingCartVersion },
          { $set: { items: [] } },
        );
    const currentCart = await CartModel.findOne({ userId }).select("items").lean();
    if (input.saveAddress) await saveDefaultAddress(userId, input.shippingAddress);
    return {
      order: toCheckoutOrder(existing),
      created: false,
      cartCleared:
        clearResult?.modifiedCount === 1 || !currentCart || currentCart.items.length === 0,
    };
  }

  const cart = (await CartModel.findOne({ userId })
    .select("_id items updatedAt")
    .lean()) as StoredCheckoutCart | null;

  if (!cart || cart.items.length === 0) throw new CheckoutEmptyCartError();

  const resolvedCart = await validateCartLines(
    cart.items.map((item) => ({ productId: item.productId.toString(), quantity: item.quantity })),
  );

  if (!cartMatchesCheckoutConfirmation(resolvedCart, input.expectedItems)) {
    throw new CheckoutCartChangedError();
  }

  if (resolvedCart.totals.length !== 1) throw new CheckoutCurrencyError();
  const total = resolvedCart.totals[0]!;
  if (!Number.isSafeInteger(total.amount)) throw new CheckoutAmountError();

  let order: CheckoutOrder;
  let created = true;

  try {
    const document = await OrderModel.create({
      userId: new Types.ObjectId(userId),
      items: resolvedCart.items.map((item) => ({
        productId: new Types.ObjectId(item.product.id),
        name: item.product.name,
        image: item.product.image ?? undefined,
        unitPrice: item.product.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      totalAmount: total.amount,
      currency: total.currency,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      orderStatus: "pending",
      shippingAddress: normalizedAddress(input.shippingAddress),
      checkoutKey: input.idempotencyKey,
      cartVersion: cart.updatedAt,
    });
    order = toCheckoutOrder(document.toObject());
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const duplicate = await findOrderDocumentByCheckoutIdentity(
      userId,
      input.idempotencyKey,
      cart.updatedAt,
    );
    if (!duplicate) throw error;
    order = toCheckoutOrder(duplicate);
    created = false;
  }

  const clearResult = await CartModel.updateOne(
    { _id: cart._id, updatedAt: cart.updatedAt },
    { $set: { items: [] } },
  );
  const cartCleared = clearResult.modifiedCount === 1;

  if (input.saveAddress) await saveDefaultAddress(userId, input.shippingAddress);

  return { order, created, cartCleared };
}

export async function getCheckoutOrder(
  userId: string,
  orderId: string,
): Promise<CheckoutOrder | null> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(orderId)) return null;

  const order = await OrderModel.findOne({ _id: orderId, userId }).lean();
  return order ? toCheckoutOrder(order) : null;
}
