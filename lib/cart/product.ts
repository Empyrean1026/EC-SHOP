import type { CatalogProduct } from "@/types/product";
import type { CartProductSnapshot } from "@/types/cart";

export function toCartProductSnapshot(product: CatalogProduct): CartProductSnapshot {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    currency: product.currency,
    image: product.images[0] ?? null,
    stock: product.stock,
  };
}
