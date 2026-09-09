import assert from "node:assert/strict";
import test from "node:test";
import { toAIProduct } from "@/lib/ai/product-dto";
import { AI_PRODUCT_SEARCH_SORT, toProductListQuery } from "@/lib/ai/product-search";
import { buildProductDetailUrl } from "@/lib/products/url";
import {
  AI_PRODUCT_SEARCH_DEFAULT_LIMIT,
  AI_PRODUCT_SEARCH_MAX_LIMIT,
  aiProductSearchCriteriaSchema,
} from "@/lib/validations/ai-product-search";
import type { CatalogProduct } from "@/types/product";

const catalogProduct: CatalogProduct = {
  id: "507f1f77bcf86cd799439011",
  name: "ワイヤレスマウス",
  slug: "wireless-mouse",
  description: "静かなクリック音で快適に使えるワイヤレスマウスです。",
  price: 3480,
  currency: "jpy",
  category: {
    id: "507f1f77bcf86cd799439012",
    name: "家電・デジタル",
    slug: "electronics",
  },
  images: ["/products/wireless-mouse.svg", "/products/wireless-mouse-side.svg"],
  stock: 15,
  rating: 4.6,
  reviewCount: 24,
  salesCount: 80,
  isActive: true,
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-27T00:00:00.000Z",
};

test("AI product criteria default to five in-stock products", () => {
  const parsed = aiProductSearchCriteriaSchema.parse({});

  assert.equal(parsed.inStock, true);
  assert.equal(parsed.limit, AI_PRODUCT_SEARCH_DEFAULT_LIMIT);
});

test("AI product criteria accept every supported search condition", () => {
  const parsed = aiProductSearchCriteriaSchema.parse({
    query: "  マウス  ",
    category: "electronics",
    minPrice: 1000,
    maxPrice: 5000,
    inStock: false,
    limit: AI_PRODUCT_SEARCH_MAX_LIMIT,
  });

  assert.deepEqual(parsed, {
    query: "マウス",
    category: "electronics",
    minPrice: 1000,
    maxPrice: 5000,
    inStock: false,
    limit: 10,
  });
});

test("AI criteria map only to the controlled Product Service query", () => {
  const criteria = aiProductSearchCriteriaSchema.parse({
    query: "マウス",
    category: "electronics",
    maxPrice: 5000,
  });
  const query = toProductListQuery(criteria);

  assert.deepEqual(query, {
    q: "マウス",
    category: "electronics",
    page: 1,
    limit: 5,
    minPrice: undefined,
    maxPrice: 5000,
    currency: undefined,
    inStock: true,
    sort: AI_PRODUCT_SEARCH_SORT,
  });
  assert.equal(query.sort, "sales_desc");
});

test("AI price criteria accept zero and reject an inverted range", () => {
  const zero = aiProductSearchCriteriaSchema.safeParse({ maxPrice: 0 });
  const inverted = aiProductSearchCriteriaSchema.safeParse({ minPrice: 5000, maxPrice: 1000 });

  assert.equal(zero.success, true);
  assert.equal(inverted.success, false);
});

test("AI criteria reject invalid categories and excessive limits", () => {
  assert.equal(
    aiProductSearchCriteriaSchema.safeParse({ category: "Home & Office" }).success,
    false,
  );
  assert.equal(
    aiProductSearchCriteriaSchema.safeParse({ limit: AI_PRODUCT_SEARCH_MAX_LIMIT + 1 }).success,
    false,
  );
});

test("AI criteria do not coerce types or accept MongoDB operators", () => {
  assert.equal(aiProductSearchCriteriaSchema.safeParse({ maxPrice: "5000" }).success, false);
  assert.equal(aiProductSearchCriteriaSchema.safeParse({ inStock: "true" }).success, false);
  assert.equal(aiProductSearchCriteriaSchema.safeParse({ maxPrice: { $gt: 0 } }).success, false);
  assert.equal(aiProductSearchCriteriaSchema.safeParse({ $where: "return true" }).success, false);
});

test("AI product DTO exposes only grounded recommendation fields", () => {
  const product = toAIProduct(catalogProduct);

  assert.deepEqual(Object.keys(product).sort(), [
    "category",
    "currency",
    "description",
    "id",
    "image",
    "name",
    "price",
    "slug",
    "stock",
    "url",
  ]);
  assert.deepEqual(product.category, { name: "家電・デジタル", slug: "electronics" });
  assert.equal(product.image, "/products/wireless-mouse.svg");
  assert.equal(product.url, "/products/wireless-mouse");
  assert.equal(buildProductDetailUrl("desk lamp"), "/products/desk%20lamp");
  assert.equal("salesCount" in product, false);
  assert.equal("isActive" in product, false);
});
