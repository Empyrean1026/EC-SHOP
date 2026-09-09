import { buildProductDetailUrl } from "@/lib/products/url";
import type { AIProduct } from "@/types/ai";
import type { CatalogProduct } from "@/types/product";

export function toAIProduct(product: CatalogProduct): AIProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category
      ? {
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    price: product.price,
    currency: product.currency,
    stock: product.stock,
    image: product.images[0] ?? null,
    url: buildProductDetailUrl(product.slug),
  };
}
