import "server-only";

import { Types } from "mongoose";
import { CART_MAX_DISTINCT_ITEMS, CART_MAX_QUANTITY } from "@/lib/cart/constants";
import { calculateCartTotals, calculateTotalQuantity } from "@/lib/cart/totals";
import { connectToDatabase } from "@/lib/mongodb";
import type { CartLineInput } from "@/lib/validations/cart";
import { CartModel, ProductModel } from "@/models";
import type { CartAdjustment, CartLine, CartProductSnapshot, ShoppingCart } from "@/types/cart";

type StoredCartLine = CartLineInput & {
  addedAt?: Date;
};

type CartDocument = Awaited<ReturnType<typeof findOrCreateCart>>;

export class CartProductUnavailableError extends Error {
  constructor() {
    super("Product is not available");
    this.name = "CartProductUnavailableError";
  }
}

export class CartStockExceededError extends Error {
  constructor(public readonly availableStock: number) {
    super("Requested quantity exceeds available stock");
    this.name = "CartStockExceededError";
  }
}

export class CartItemNotFoundError extends Error {
  constructor() {
    super("Cart item does not exist");
    this.name = "CartItemNotFoundError";
  }
}

export class CartCapacityError extends Error {
  constructor() {
    super("Cart has reached its distinct item limit");
    this.name = "CartCapacityError";
  }
}

function toProductSnapshot(source: {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  price: number;
  currency: CartProductSnapshot["currency"];
  images: string[];
  stock: number;
}): CartProductSnapshot {
  return {
    id: source._id.toString(),
    name: source.name,
    slug: source.slug,
    price: source.price,
    currency: source.currency,
    image: source.images[0] ?? null,
    stock: source.stock,
  };
}

async function resolveCartLines(lines: StoredCartLine[]): Promise<{
  cart: ShoppingCart;
  storedLines: StoredCartLine[];
}> {
  const limitedLines = lines.slice(0, CART_MAX_DISTINCT_ITEMS);
  const overflowLines = lines.slice(CART_MAX_DISTINCT_ITEMS);
  const productIds = limitedLines.map((line) => line.productId);
  const products = await ProductModel.find({
    _id: { $in: productIds },
    isActive: true,
  })
    .select("_id name slug price currency images stock")
    .lean();
  const productById = new Map(products.map((product) => [product._id.toString(), product]));
  const items: CartLine[] = [];
  const storedLines: StoredCartLine[] = [];
  const adjustments: CartAdjustment[] = overflowLines.map((line) => ({
    productId: line.productId,
    code: "CART_CAPACITY_REACHED",
  }));

  for (const line of limitedLines) {
    const product = productById.get(line.productId);

    if (!product) {
      adjustments.push({ productId: line.productId, code: "PRODUCT_REMOVED" });
      continue;
    }

    if (product.stock <= 0) {
      adjustments.push({ productId: line.productId, code: "OUT_OF_STOCK" });
      continue;
    }

    const quantity = Math.min(line.quantity, product.stock, CART_MAX_QUANTITY);

    if (quantity < line.quantity) {
      adjustments.push({
        productId: line.productId,
        code: "QUANTITY_REDUCED",
        fromQuantity: line.quantity,
        toQuantity: quantity,
      });
    }

    const productSnapshot = toProductSnapshot(product);
    items.push({
      product: productSnapshot,
      quantity,
      subtotal: product.price * quantity,
    });
    storedLines.push({
      productId: line.productId,
      quantity,
      addedAt: line.addedAt,
    });
  }

  return {
    cart: {
      items,
      itemCount: items.length,
      totalQuantity: calculateTotalQuantity(items),
      totals: calculateCartTotals(items),
      adjustments,
    },
    storedLines,
  };
}

function documentLines(cart: CartDocument): StoredCartLine[] {
  return cart.items.map((item) => ({
    productId: item.productId.toString(),
    quantity: item.quantity,
    addedAt: item.addedAt,
  }));
}

async function findOrCreateCart(userId: string) {
  return (
    (await CartModel.findOne({ userId })) ??
    new CartModel({ userId: new Types.ObjectId(userId), items: [] })
  );
}

async function saveResolvedCart(
  cart: CartDocument,
  lines: StoredCartLine[],
): Promise<ShoppingCart> {
  const resolved = await resolveCartLines(lines);
  cart.set(
    "items",
    resolved.storedLines.map((line) => ({
      productId: new Types.ObjectId(line.productId),
      quantity: line.quantity,
      addedAt: line.addedAt,
    })),
  );
  await cart.save();
  return resolved.cart;
}

export async function getUserCart(userId: string): Promise<ShoppingCart> {
  await connectToDatabase();
  const cart = await CartModel.findOne({ userId });

  if (!cart) {
    return {
      items: [],
      itemCount: 0,
      totalQuantity: 0,
      totals: [],
      adjustments: [],
    };
  }

  return (await resolveCartLines(documentLines(cart))).cart;
}

export async function validateCartLines(lines: CartLineInput[]): Promise<ShoppingCart> {
  await connectToDatabase();
  return (await resolveCartLines(lines)).cart;
}

export async function addUserCartItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<ShoppingCart> {
  await connectToDatabase();
  const [cart, product] = await Promise.all([
    findOrCreateCart(userId),
    ProductModel.findOne({ _id: productId, isActive: true }).select("_id stock").lean(),
  ]);

  if (!product || product.stock <= 0) throw new CartProductUnavailableError();

  const lines = documentLines(cart);
  const existing = lines.find((line) => line.productId === productId);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  if (nextQuantity > product.stock || nextQuantity > CART_MAX_QUANTITY) {
    throw new CartStockExceededError(Math.min(product.stock, CART_MAX_QUANTITY));
  }

  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    if (lines.length >= CART_MAX_DISTINCT_ITEMS) throw new CartCapacityError();
    lines.push({ productId, quantity, addedAt: new Date() });
  }

  return saveResolvedCart(cart, lines);
}

export async function updateUserCartItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<ShoppingCart> {
  await connectToDatabase();
  const [cart, product] = await Promise.all([
    findOrCreateCart(userId),
    ProductModel.findOne({ _id: productId, isActive: true }).select("_id stock").lean(),
  ]);
  const lines = documentLines(cart);
  const existing = lines.find((line) => line.productId === productId);

  if (!existing) throw new CartItemNotFoundError();
  if (!product || product.stock <= 0) throw new CartProductUnavailableError();
  if (quantity > product.stock) {
    throw new CartStockExceededError(Math.min(product.stock, CART_MAX_QUANTITY));
  }

  existing.quantity = quantity;
  return saveResolvedCart(cart, lines);
}

export async function removeUserCartItem(userId: string, productId: string): Promise<ShoppingCart> {
  await connectToDatabase();
  const cart = await findOrCreateCart(userId);
  const lines = documentLines(cart);
  const nextLines = lines.filter((line) => line.productId !== productId);

  if (nextLines.length === lines.length) throw new CartItemNotFoundError();
  return saveResolvedCart(cart, nextLines);
}

export async function clearUserCart(userId: string): Promise<ShoppingCart> {
  await connectToDatabase();
  const cart = await findOrCreateCart(userId);
  cart.set("items", []);
  await cart.save();

  return {
    items: [],
    itemCount: 0,
    totalQuantity: 0,
    totals: [],
    adjustments: [],
  };
}

export async function mergeUserCart(
  userId: string,
  incomingLines: CartLineInput[],
): Promise<ShoppingCart> {
  await connectToDatabase();
  const cart = await findOrCreateCart(userId);
  const mergedLines = documentLines(cart);
  const lineByProductId = new Map(mergedLines.map((line) => [line.productId, line]));

  for (const incoming of incomingLines) {
    const existing = lineByProductId.get(incoming.productId);

    if (existing) {
      existing.quantity += incoming.quantity;
    } else {
      const line = { ...incoming, addedAt: new Date() };
      mergedLines.push(line);
      lineByProductId.set(incoming.productId, line);
    }
  }

  return saveResolvedCart(cart, mergedLines);
}
