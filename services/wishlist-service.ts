import "server-only";

import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { toCatalogProduct } from "@/lib/products/dto";
import { ProductModel, WishlistModel } from "@/models";
import type { AccountWishlist } from "@/types/account";

export const WISHLIST_MAX_ITEMS = 100;

export class WishlistProductNotFoundError extends Error {
  constructor() {
    super("Wishlist product does not exist or is inactive");
    this.name = "WishlistProductNotFoundError";
  }
}

export class WishlistCapacityError extends Error {
  constructor() {
    super("Wishlist is full");
    this.name = "WishlistCapacityError";
  }
}

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  await connectToDatabase();
  const wishlist = await WishlistModel.findOne({ userId }).select("productIds").lean();
  return wishlist?.productIds.map(String) ?? [];
}

export async function getUserWishlist(userId: string): Promise<AccountWishlist> {
  await connectToDatabase();
  const productIds = await getWishlistProductIds(userId);

  if (productIds.length === 0) return { items: [], productIds: [], count: 0 };

  const documents = await ProductModel.find({ _id: { $in: productIds }, isActive: true })
    .populate({ path: "category", select: "_id name slug" })
    .lean();
  const productById = new Map(documents.map((product) => [String(product._id), product]));
  const activeIds = productIds.filter((id) => productById.has(id));

  return {
    items: activeIds.map((id) => toCatalogProduct(productById.get(id))),
    productIds: activeIds,
    count: activeIds.length,
  };
}

export async function addWishlistProduct(userId: string, productId: string): Promise<void> {
  await connectToDatabase();
  const objectId = new Types.ObjectId(productId);
  const [productExists, wishlist] = await Promise.all([
    ProductModel.exists({ _id: objectId, isActive: true }),
    WishlistModel.findOne({ userId }).select("productIds"),
  ]);

  if (!productExists) throw new WishlistProductNotFoundError();
  if (wishlist?.productIds.some((id) => id.equals(objectId))) return;
  if ((wishlist?.productIds.length ?? 0) >= WISHLIST_MAX_ITEMS) throw new WishlistCapacityError();

  if (wishlist) {
    wishlist.productIds.unshift(objectId);
    await wishlist.save();
  } else {
    await WishlistModel.create({ userId, productIds: [objectId] });
  }
}

export async function removeWishlistProduct(userId: string, productId: string): Promise<void> {
  await connectToDatabase();
  const wishlist = await WishlistModel.findOneAndUpdate(
    { userId },
    { $pull: { productIds: new Types.ObjectId(productId) } },
    { returnDocument: "after" },
  ).select("_id productIds");

  if (wishlist?.productIds.length === 0) {
    await WishlistModel.deleteOne({ _id: wishlist._id, productIds: { $size: 0 } });
  }
}
