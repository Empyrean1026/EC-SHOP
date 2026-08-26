import type { CurrencyCode } from "@/models";
import type { CatalogCategory, CatalogProduct, ProductCategorySummary } from "@/types/product";

type UnknownRecord = Record<string, unknown>;

function numericValue(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function stringId(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "toString" in value) {
    return String(value);
  }

  return "";
}

function serializeCategory(value: unknown): ProductCategorySummary | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const category = value as UnknownRecord;

  if (typeof category.name !== "string" || typeof category.slug !== "string") {
    return null;
  }

  return {
    id: stringId(category._id),
    name: category.name,
    slug: category.slug,
  };
}

export function toCatalogProduct(source: unknown): CatalogProduct {
  const product = source as UnknownRecord;

  return {
    id: stringId(product._id),
    name: String(product.name),
    slug: String(product.slug),
    description: String(product.description),
    price: numericValue(product.price),
    currency: product.currency as CurrencyCode,
    category: serializeCategory(product.category),
    images: Array.isArray(product.images) ? product.images.map(String) : [],
    stock: numericValue(product.stock),
    rating: numericValue(product.rating),
    reviewCount: numericValue(product.reviewCount),
    salesCount: numericValue(product.salesCount),
    isActive: Boolean(product.isActive),
    createdAt: new Date(product.createdAt as string | number | Date).toISOString(),
    updatedAt: new Date(product.updatedAt as string | number | Date).toISOString(),
  };
}

export function toCatalogCategory(source: unknown, productCount: number): CatalogCategory {
  const category = source as UnknownRecord;

  return {
    id: stringId(category._id),
    name: String(category.name),
    slug: String(category.slug),
    description: typeof category.description === "string" ? category.description : null,
    image: typeof category.image === "string" ? category.image : null,
    parentCategoryId: category.parentCategory ? stringId(category.parentCategory) : null,
    productCount,
  };
}
