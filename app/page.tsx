import type { Metadata } from "next";
import { StorefrontHome } from "@/components/home/storefront-home";
import { isShopDemo } from "@/lib/demo";
import { productListQuerySchema } from "@/lib/validations/product";
import { listCategories, listProducts } from "@/services/product-service";
import type { CatalogCategory, CatalogProduct } from "@/types/product";

export const metadata: Metadata = {
  title: "暮らしとデスクの生活雑貨",
  description:
    "デスク用品、生活雑貨、ホームフィットネス用品を閲覧できるポートフォリオ用ECデモです。",
};

export const dynamic = "force-dynamic";

type HomeCatalog = {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  catalogStatus: "ready" | "error";
};

async function loadHomeCatalog(): Promise<HomeCatalog> {
  try {
    const query = productListQuerySchema.parse({ limit: 24, sort: "newest" });
    const [result, categories] = await Promise.all([listProducts(query), listCategories()]);

    return {
      products: result.items,
      categories,
      catalogStatus: "ready",
    };
  } catch (error) {
    console.error("Homepage catalog could not be loaded.", error);
    return { products: [], categories: [], catalogStatus: "error" };
  }
}

export default async function Home() {
  const catalog = await loadHomeCatalog();

  return <StorefrontHome {...catalog} demoMode={isShopDemo()} />;
}
