import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatProductPrice, getStockLabel } from "@/lib/products/format";
import { toCartProductSnapshot } from "@/lib/cart/product";
import { ProductVisual } from "@/components/products/product-visual";
import { WishlistButton } from "@/components/account/wishlist-button";
import type { CatalogProduct } from "@/types/product";

type ProductCardProps = {
  product: CatalogProduct;
  initialWishlisted?: boolean;
};

export function ProductCard({ product, initialWishlisted = false }: ProductCardProps) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/8">
      <Link href={`/products/${product.slug}`} className="focus-visible:outline-orange-600">
        <ProductVisual
          name={product.name}
          image={product.images[0]}
          className="aspect-[4/3] w-full"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-[10px] font-semibold tracking-[0.14em] uppercase">
          <span className="truncate text-orange-600">
            {product.category?.name ?? "カテゴリーなし"}
          </span>
          <span className={product.stock > 0 ? "text-emerald-700" : "text-stone-400"}>
            {getStockLabel(product.stock)}
          </span>
        </div>

        <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-stone-950">
          <Link className="transition hover:text-orange-600" href={`/products/${product.slug}`}>
            {product.name}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500">{product.description}</p>

        <div className="mt-6 flex items-end justify-between gap-3 border-t border-stone-100 pt-4">
          <p className="text-lg font-semibold text-stone-950">
            {formatProductPrice(product.price, product.currency)}
          </p>
          <p className="text-xs text-stone-400">
            {product.rating > 0 ? `${product.rating.toFixed(1)} ★` : "レビューなし"} · 販売数{" "}
            {product.salesCount}
          </p>
        </div>
        <AddToCartButton compact product={toCartProductSnapshot(product)} />
        <WishlistButton compact productId={product.id} initialWishlisted={initialWishlisted} />
      </div>
    </article>
  );
}
