import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import { ProductModel } from "@/models";
import { toCatalogProduct } from "@/lib/products/dto";
import { formatProductPrice, getStockLabel } from "@/lib/products/format";
import { escapeRegularExpression } from "@/lib/products/search";
import { buildProductsUrl } from "@/lib/products/url";
import {
  createProductSchema,
  productListQuerySchema,
  updateProductSchema,
} from "@/lib/validations/product";

const categoryId = new Types.ObjectId().toString();

test("product list query coerces pagination, filters, and sorting", () => {
  const parsed = productListQuerySchema.safeParse({
    q: "  lamp  ",
    category: "home-objects",
    page: "2",
    limit: "24",
    minPrice: "1000",
    maxPrice: "30000",
    inStock: "true",
    sort: "price_asc",
  });

  assert.equal(parsed.success, true);

  if (parsed.success) {
    assert.equal(parsed.data.q, "lamp");
    assert.equal(parsed.data.page, 2);
    assert.equal(parsed.data.limit, 24);
    assert.equal(parsed.data.inStock, true);
    assert.equal(parsed.data.sort, "price_asc");
  }

  assert.equal(
    productListQuerySchema.safeParse({ minPrice: "300", maxPrice: "100" }).success,
    false,
  );
});

test("product creation validates catalog fields and rejects aggregate injection", () => {
  const valid = createProductSchema.safeParse({
    name: "Stone Table Lamp",
    slug: "stone-table-lamp",
    description: "A compact stone lamp for quiet interiors.",
    price: 21500,
    categoryId,
    images: ["https://example.com/lamp.jpg"],
    stock: 8,
  });
  const injected = createProductSchema.safeParse({
    name: "Stone Table Lamp",
    slug: "stone-table-lamp",
    description: "A compact stone lamp for quiet interiors.",
    price: 21500,
    categoryId,
    salesCount: 100_000,
  });

  assert.equal(valid.success, true);
  assert.equal(valid.success ? valid.data.currency : null, "jpy");
  assert.equal(injected.success, false);
});

test("product images allow safe public assets without accepting unsafe paths", () => {
  const input = {
    name: "Local Product Image",
    slug: "local-product-image",
    description: "A product backed by an original local SVG illustration.",
    price: 3600,
    categoryId,
    stock: 10,
  };

  assert.equal(
    createProductSchema.safeParse({ ...input, images: ["/products/local-image.svg"] }).success,
    true,
  );
  assert.equal(
    createProductSchema.safeParse({ ...input, images: ["/products/../secret.svg"] }).success,
    false,
  );
  assert.equal(
    createProductSchema.safeParse({ ...input, images: ["javascript:alert(1)"] }).success,
    false,
  );
});

test("product updates are strict but allow focused inventory changes", () => {
  assert.equal(updateProductSchema.safeParse({}).success, false);
  assert.equal(updateProductSchema.safeParse({ stock: 3 }).success, true);
  assert.equal(updateProductSchema.safeParse({ stock: -1 }).success, false);
  assert.equal(updateProductSchema.safeParse({ rating: 5 }).success, false);
});

test("catalog DTO serializes populated categories and dates", () => {
  const productId = new Types.ObjectId();
  const now = new Date("2026-08-26T00:00:00.000Z");
  const product = toCatalogProduct({
    _id: productId,
    name: "Stone Table Lamp",
    slug: "stone-table-lamp",
    description: "A compact stone lamp for quiet interiors.",
    price: 21500,
    currency: "jpy",
    category: { _id: categoryId, name: "Home Objects", slug: "home-objects" },
    images: [],
    stock: 8,
    rating: 4.8,
    reviewCount: 24,
    salesCount: 158,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  assert.equal(product.id, productId.toString());
  assert.equal(product.category?.slug, "home-objects");
  assert.equal(product.createdAt, now.toISOString());

  const legacyProduct = toCatalogProduct({
    ...product,
    _id: productId,
    category: null,
    salesCount: undefined,
    createdAt: now,
    updatedAt: now,
  });
  assert.equal(legacyProduct.salesCount, 0);
});

test("catalog URLs preserve active filters while changing pages", () => {
  const query = productListQuerySchema.parse({
    q: "lamp",
    category: "home-objects",
    page: "2",
    inStock: "true",
    sort: "sales_desc",
  });
  const url = buildProductsUrl(query, { page: 3 });

  assert.match(url, /^\/products\?/);
  assert.match(url, /q=lamp/);
  assert.match(url, /category=home-objects/);
  assert.match(url, /page=3/);
  assert.match(url, /sort=sales_desc/);
});

test("price and inventory formatters handle currency units and low stock", () => {
  assert.match(formatProductPrice(21500, "jpy"), /21,500/);
  assert.match(formatProductPrice(1299, "usd"), /12\.99/);
  assert.equal(getStockLabel(0), "暂时缺货");
  assert.equal(getStockLabel(3), "仅剩 3 件");
  assert.equal(getStockLabel(8), "现货供应");
});

test("keyword search escapes regular-expression control characters", () => {
  const input = "lamp.*(sale)?";
  const expression = new RegExp(escapeRegularExpression(input), "i");

  assert.equal(expression.test("Lamp.*(sale)? collection"), true);
  assert.equal(expression.test("lamp discounted sale"), false);
});

test("Product declares indexes for catalog sorting and inventory filters", () => {
  const indexes = ProductModel.schema.indexes().map(([fields]) => fields);

  assert.equal(
    indexes.some(
      (fields) => fields.isActive === 1 && fields.stock === 1 && fields.createdAt === -1,
    ),
    true,
  );
});
