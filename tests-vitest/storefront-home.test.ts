import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StorefrontHome } from "@/components/home/storefront-home";
import type { CatalogCategory, CatalogProduct } from "@/types/product";

vi.mock("@/components/products/product-card", async () => {
  const ReactModule = await import("react");

  return {
    ProductCard: ({ product }: { product: CatalogProduct }) =>
      ReactModule.createElement("a", { href: `/products/${product.slug}` }, product.name),
  };
});

const category: CatalogCategory = {
  id: "category-stationery",
  name: "デスク用品",
  slug: "stationery",
  description: null,
  image: null,
  parentCategoryId: null,
  productCount: 1,
};

const fixture: CatalogProduct = {
  id: "product-laptop-stand",
  name: "アルミ製ノートPCスタンド",
  slug: "aluminum-laptop-stand",
  description: "目線を整え、デスクをすっきり使えるスタンドです。",
  price: 4200,
  currency: "jpy",
  category: { id: category.id, name: category.name, slug: category.slug },
  images: ["/products/aluminum-laptop-stand.svg"],
  stock: 12,
  rating: 4.7,
  reviewCount: 18,
  salesCount: 40,
  isActive: true,
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
};

function renderHome(
  products: CatalogProduct[],
  categories: CatalogCategory[],
  catalogStatus: "ready" | "error" = "ready",
) {
  return renderToStaticMarkup(
    React.createElement(StorefrontHome, {
      products,
      categories,
      catalogStatus,
      demoMode: true,
    }),
  );
}

describe("storefront homepage", () => {
  it("renders product name, formatted price, and detail URL from one catalog fixture", () => {
    const markup = renderHome([fixture], [category]);

    expect(markup).toContain("アルミ製ノートPCスタンド");
    expect(markup).toMatch(/￥4,200|¥4,200/);
    expect(markup).toContain('href="/products/aluminum-laptop-stand"');
    expect(markup).toContain('href="/products?category=stationery"');
    expect(markup).toContain("実際の注文・決済と有料AIへのリクエストは行われません");
    expect(markup).not.toContain("Form Chair");
    expect(markup).not.toContain("Stone Lamp");
  });

  it("shows an honest empty state without fabricating products", () => {
    const markup = renderHome([], []);

    expect(markup).toContain("商品は現在準備中です");
    expect(markup).not.toContain("Form Chair");
  });

  it("distinguishes catalog failures from a successful catalog", () => {
    const markup = renderHome([], [], "error");

    expect(markup).toContain("商品情報を読み込めませんでした");
    expect(markup).toContain("時間をおいてから");
  });
});
