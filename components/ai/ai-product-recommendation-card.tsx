"use client";

import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductVisual } from "@/components/products/product-visual";
import { formatProductPrice, getStockLabel } from "@/lib/products/format";
import type { AIRecommendedProduct } from "@/types/ai";
import type { CartProductSnapshot } from "@/types/cart";

type AIProductRecommendationCardProps = {
  product: AIRecommendedProduct;
  onNavigate: () => void;
};

function toCartSnapshot(product: AIRecommendedProduct): CartProductSnapshot {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    currency: product.currency,
    image: product.image,
    stock: product.stock,
  };
}

export function AIProductRecommendationCard({
  product,
  onNavigate,
}: AIProductRecommendationCardProps) {
  return (
    <article
      aria-labelledby={`assistant-product-${product.id}`}
      className="overflow-hidden rounded-3xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
      data-testid="assistant-product-card"
    >
      <ProductVisual
        className="aspect-[16/9] w-full"
        image={product.image ?? undefined}
        name={product.name}
        sizes="(max-width: 639px) 100vw, 440px"
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product.category ? (
              <p className="truncate text-[10px] font-semibold tracking-[0.12em] text-orange-600 uppercase">
                {product.category.name}
              </p>
            ) : null}
            <h3
              className="mt-1 text-base font-semibold tracking-[-0.02em] text-stone-950 dark:text-stone-50"
              id={`assistant-product-${product.id}`}
            >
              {product.name}
            </h3>
          </div>
          <span
            className={`shrink-0 text-[11px] font-medium ${
              product.stock > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-stone-400"
            }`}
          >
            {getStockLabel(product.stock)}
          </span>
        </div>

        <p className="mt-3 text-lg font-semibold text-stone-950 dark:text-stone-50">
          {formatProductPrice(product.price, product.currency)}
        </p>
        <p className="mt-3 text-sm leading-6 break-words whitespace-pre-wrap text-stone-600 dark:text-stone-300">
          {product.recommendationReason}
        </p>

        <Link
          aria-label={`${product.name}の商品詳細を見る`}
          className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-stone-950 px-4 text-xs font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 dark:bg-stone-50 dark:text-stone-950 dark:hover:bg-orange-500 dark:hover:text-white"
          href={product.url}
          onClick={onNavigate}
        >
          商品を見る
        </Link>
        <AddToCartButton compact product={toCartSnapshot(product)} showInlineSuccess />
      </div>
    </article>
  );
}
