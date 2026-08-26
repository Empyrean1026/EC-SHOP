import "server-only";

import { cache } from "react";
import { Types, type QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { toCatalogCategory, toCatalogProduct } from "@/lib/products/dto";
import { escapeRegularExpression } from "@/lib/products/search";
import type {
  CreateProductInput,
  ProductListQuery,
  UpdateProductInput,
} from "@/lib/validations/product";
import { CategoryModel, ProductModel, type Product } from "@/models";
import type { CatalogCategory, CatalogProduct, ProductListResult } from "@/types/product";

type SortDirection = 1 | -1;

const PRODUCT_SORTS: Record<ProductListQuery["sort"], Record<string, SortDirection>> = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
  sales_desc: { salesCount: -1, createdAt: -1, _id: -1 },
  rating_desc: { rating: -1, reviewCount: -1, _id: -1 },
};

export class ProductCategoryNotFoundError extends Error {
  constructor() {
    super("Product category does not exist or is inactive");
    this.name = "ProductCategoryNotFoundError";
  }
}

async function resolveCategoryId(value: string): Promise<Types.ObjectId | null> {
  const identity = Types.ObjectId.isValid(value) ? { _id: value } : { slug: value };
  const category = await CategoryModel.findOne({ ...identity, isActive: true })
    .select("_id")
    .lean();

  return category?._id ?? null;
}

function emptyProductList(query: ProductListQuery): ProductListResult {
  return {
    items: [],
    pagination: {
      page: query.page,
      limit: query.limit,
      total: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  };
}

export async function listProducts(query: ProductListQuery): Promise<ProductListResult> {
  await connectToDatabase();

  const filter: QueryFilter<Product> = { isActive: true };

  if (query.category) {
    const categoryId = await resolveCategoryId(query.category);

    if (!categoryId) {
      return emptyProductList(query);
    }

    filter.category = categoryId;
  }

  if (query.q) {
    const expression = new RegExp(escapeRegularExpression(query.q), "i");
    filter.$or = [{ name: expression }, { description: expression }];
  }

  if (query.currency) {
    filter.currency = query.currency;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }

  if (query.inStock === true) {
    filter.stock = { $gt: 0 };
  } else if (query.inStock === false) {
    filter.stock = 0;
  }

  const skip = (query.page - 1) * query.limit;
  const [documents, total] = await Promise.all([
    ProductModel.find(filter)
      .populate({ path: "category", select: "_id name slug" })
      .sort(PRODUCT_SORTS[query.sort])
      .skip(skip)
      .limit(query.limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

  return {
    items: documents.map(toCatalogProduct),
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

export const getProductByIdentifier = cache(
  async (identifier: string): Promise<CatalogProduct | null> => {
    await connectToDatabase();

    const identity = Types.ObjectId.isValid(identifier)
      ? { _id: identifier }
      : { slug: identifier };
    const product = await ProductModel.findOne({ ...identity, isActive: true })
      .populate({ path: "category", select: "_id name slug" })
      .lean();

    return product ? toCatalogProduct(product) : null;
  },
);

async function requireActiveCategory(categoryId: string): Promise<void> {
  const exists = await CategoryModel.exists({ _id: categoryId, isActive: true });

  if (!exists) {
    throw new ProductCategoryNotFoundError();
  }
}

export async function createProduct(input: CreateProductInput): Promise<CatalogProduct> {
  await connectToDatabase();
  await requireActiveCategory(input.categoryId);

  const { categoryId, ...fields } = input;
  const product = await ProductModel.create({
    ...fields,
    category: categoryId,
  });

  await product.populate({ path: "category", select: "_id name slug" });
  return toCatalogProduct(product.toObject());
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput,
): Promise<CatalogProduct | null> {
  await connectToDatabase();

  if (input.categoryId) {
    await requireActiveCategory(input.categoryId);
  }

  const { categoryId, ...fields } = input;
  const update = {
    ...fields,
    ...(categoryId ? { category: categoryId } : {}),
  };
  const product = await ProductModel.findByIdAndUpdate(
    productId,
    { $set: update },
    { returnDocument: "after", runValidators: true },
  ).populate({ path: "category", select: "_id name slug" });

  return product ? toCatalogProduct(product.toObject()) : null;
}

export async function deactivateProduct(productId: string): Promise<CatalogProduct | null> {
  await connectToDatabase();

  const product = await ProductModel.findOneAndUpdate(
    { _id: productId, isActive: true },
    { $set: { isActive: false, stock: 0 } },
    { returnDocument: "after", runValidators: true },
  ).populate({ path: "category", select: "_id name slug" });

  return product ? toCatalogProduct(product.toObject()) : null;
}

export async function listCategories(): Promise<CatalogCategory[]> {
  await connectToDatabase();

  const categories = await CategoryModel.find({ isActive: true }).sort({ name: 1, _id: 1 }).lean();
  const categoryIds = categories.map((category) => category._id);
  const counts = await ProductModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { isActive: true, category: { $in: categoryIds } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countByCategory = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));

  return categories.map((category) =>
    toCatalogCategory(category, countByCategory.get(category._id.toString()) ?? 0),
  );
}
