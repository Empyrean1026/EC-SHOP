import type { CatalogCategory, CatalogProduct } from "@/types/product";

export const HOME_FEATURED_PRODUCT_SLUGS = [
  "aluminum-laptop-stand",
  "soft-reading-desk-lamp",
  "silent-wireless-mouse",
  "five-level-resistance-bands",
  "cushioned-yoga-mat",
  "double-insulated-lunch-box",
] as const;

const HOME_SCENE_DEFINITIONS = [
  {
    id: "desk",
    categorySlug: "stationery",
    title: "デスク環境を整える",
    description: "仕事や勉強の時間を、すっきり心地よく整えるアイテム。",
  },
  {
    id: "fitness",
    categorySlug: "sports-fitness",
    title: "おうちで体を動かす",
    description: "ストレッチから軽い筋力トレーニングまで、無理なく続けるための道具。",
  },
  {
    id: "living",
    categorySlug: "home-living",
    title: "毎日の暮らしに",
    description: "家で過ごす時間や日々の持ち運びに、自然になじむ生活用品。",
  },
] as const;

export type HomeScene = (typeof HOME_SCENE_DEFINITIONS)[number] & {
  categoryName: string;
  href: string;
  product: CatalogProduct | null;
};

export function selectHomeProducts(products: CatalogProduct[], limit = 6): CatalogProduct[] {
  const eligible = products.filter((product) => product.isActive && product.stock > 0);
  const bySlug = new Map(eligible.map((product) => [product.slug, product]));
  const selected: CatalogProduct[] = [];
  const selectedIds = new Set<string>();

  for (const slug of HOME_FEATURED_PRODUCT_SLUGS) {
    const product = bySlug.get(slug);
    if (!product || selectedIds.has(product.id)) continue;
    selected.push(product);
    selectedIds.add(product.id);
    if (selected.length === limit) return selected;
  }

  for (const product of eligible) {
    if (selectedIds.has(product.id)) continue;
    selected.push(product);
    selectedIds.add(product.id);
    if (selected.length === limit) break;
  }

  return selected;
}

export function buildHomeScenes(
  categories: CatalogCategory[],
  products: CatalogProduct[],
): HomeScene[] {
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  return HOME_SCENE_DEFINITIONS.flatMap((scene) => {
    const category = categoryBySlug.get(scene.categorySlug);
    if (!category) return [];

    return [
      {
        ...scene,
        categoryName: category.name,
        href: `/products?category=${encodeURIComponent(category.slug)}`,
        product:
          products.find(
            (product) => product.category?.slug === category.slug && product.stock > 0,
          ) ?? null,
      },
    ];
  });
}
