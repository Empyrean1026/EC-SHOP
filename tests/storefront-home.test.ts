import assert from "node:assert/strict";
import test from "node:test";
import { buildHomeScenes, selectHomeProducts } from "@/lib/storefront/home";
import type { CatalogCategory, CatalogProduct } from "@/types/product";

function product(
  id: string,
  slug: string,
  categorySlug: string,
  overrides: Partial<CatalogProduct> = {},
): CatalogProduct {
  return {
    id,
    name: `商品 ${id}`,
    slug,
    description: "毎日の暮らしで使えるテスト商品です。",
    price: 2600,
    currency: "jpy",
    category: { id: `category-${categorySlug}`, name: categorySlug, slug: categorySlug },
    images: [`/products/${slug}.svg`],
    stock: 8,
    rating: 4.8,
    reviewCount: 10,
    salesCount: 25,
    isActive: true,
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
    ...overrides,
  };
}

const categories: CatalogCategory[] = [
  {
    id: "category-stationery",
    name: "デスク用品",
    slug: "stationery",
    description: null,
    image: null,
    parentCategoryId: null,
    productCount: 1,
  },
  {
    id: "category-sports-fitness",
    name: "スポーツ・フィットネス",
    slug: "sports-fitness",
    description: null,
    image: null,
    parentCategoryId: null,
    productCount: 1,
  },
];

test("homepage selection uses real eligible products without inventing items", () => {
  const products = [
    product("1", "aluminum-laptop-stand", "stationery"),
    product("2", "five-level-resistance-bands", "sports-fitness"),
    product("3", "inactive-item", "stationery", { isActive: false }),
    product("4", "sold-out-item", "stationery", { stock: 0 }),
  ];

  const selected = selectHomeProducts(products, 6);

  assert.deepEqual(
    selected.map((item) => item.id),
    ["1", "2"],
  );
  assert.equal(selected.length, 2);
});

test("homepage scenes use only available category slugs and matching real products", () => {
  const products = [
    product("1", "aluminum-laptop-stand", "stationery"),
    product("2", "five-level-resistance-bands", "sports-fitness"),
  ];

  const scenes = buildHomeScenes(categories, products);

  assert.deepEqual(
    scenes.map((scene) => scene.href),
    ["/products?category=stationery", "/products?category=sports-fitness"],
  );
  assert.equal(scenes[0]?.product?.slug, "aluminum-laptop-stand");
  assert.equal(
    scenes.some((scene) => scene.categorySlug === "home-living"),
    false,
  );
});

test("empty homepage input remains empty instead of restoring template products", () => {
  assert.deepEqual(selectHomeProducts([]), []);
  assert.deepEqual(buildHomeScenes([], []), []);
});
