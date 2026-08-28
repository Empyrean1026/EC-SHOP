import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WishlistButton } from "@/components/account/wishlist-button";
import { ProductVisual } from "@/components/products/product-visual";
import { toCartProductSnapshot } from "@/lib/cart/product";
import { formatProductPrice, getStockLabel } from "@/lib/products/format";
import { getProductByIdentifier } from "@/services/product-service";
import { getCurrentUser } from "@/lib/auth/dal";
import { getWishlistProductIds } from "@/services/wishlist-service";

export const dynamic = "force-dynamic";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const product = await getProductByIdentifier((await params).id);

  return product
    ? {
        title: product.name,
        description: product.description.slice(0, 160),
      }
    : { title: "商品が見つかりません" };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [product, user] = await Promise.all([
    getProductByIdentifier((await params).id),
    getCurrentUser(),
  ]);

  if (!product) {
    notFound();
  }

  const wishlistIds = user ? await getWishlistProductIds(user.id) : [];

  return (
    <article className="bg-stone-100 px-5 py-10 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <nav className="flex items-center gap-2 text-xs text-stone-500" aria-label="パンくずリスト">
          <Link className="hover:text-stone-950" href="/products">
            商品一覧
          </Link>
          <span aria-hidden="true">/</span>
          {product.category ? (
            <Link
              className="hover:text-stone-950"
              href={`/products?category=${encodeURIComponent(product.category.slug)}`}
            >
              {product.category.name}
            </Link>
          ) : (
            <span>カテゴリーなし</span>
          )}
          <span aria-hidden="true">/</span>
          <span className="truncate text-stone-950">{product.name}</span>
        </nav>

        <div className="mt-8 grid overflow-hidden rounded-[2rem] border border-stone-200 bg-white lg:grid-cols-[1.08fr_0.92fr]">
          <div className="min-w-0 bg-stone-200">
            <ProductVisual
              className="aspect-square min-h-full w-full"
              image={product.images[0]}
              name={product.name}
              priority
              sizes="(min-width: 1024px) 54vw, 100vw"
            />
          </div>

          <div className="flex flex-col p-7 sm:p-10 lg:p-12">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-orange-600 uppercase">
                {product.category?.name ?? "Uncategorized"}
              </p>
              <span
                className={`rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase ${
                  product.stock > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-stone-200 text-stone-600"
                }`}
              >
                {getStockLabel(product.stock)}
              </span>
            </div>

            <h1 className="mt-7 text-4xl font-semibold tracking-[-0.05em] text-stone-950 sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-stone-950">
              {formatProductPrice(product.price, product.currency)}
            </p>
            <p className="mt-7 text-sm leading-7 whitespace-pre-line text-stone-600">
              {product.description}
            </p>

            <dl className="mt-10 grid grid-cols-3 gap-3 border-t border-stone-200 pt-7">
              <div>
                <dt className="text-[10px] tracking-wider text-stone-400 uppercase">在庫</dt>
                <dd className="mt-2 text-sm font-semibold text-stone-950">{product.stock}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-wider text-stone-400 uppercase">評価</dt>
                <dd className="mt-2 text-sm font-semibold text-stone-950">
                  {product.rating > 0 ? product.rating.toFixed(1) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-wider text-stone-400 uppercase">販売数</dt>
                <dd className="mt-2 text-sm font-semibold text-stone-950">{product.salesCount}</dd>
              </div>
            </dl>

            <div className="mt-auto pt-10">
              <AddToCartButton product={toCartProductSnapshot(product)} />
              <WishlistButton
                productId={product.id}
                initialWishlisted={wishlistIds.includes(product.id)}
              />
              <p className="mt-4 rounded-2xl bg-[#dfe5ce] px-5 py-4 text-xs leading-6 text-stone-700 dark:bg-[#20271d]">
                カート追加時に在庫を確認します。ログイン後はカートが MongoDB に安全に同期されます。
              </p>
            </div>
          </div>
        </div>

        {product.images.length > 1 ? (
          <section className="mt-8" aria-labelledby="product-gallery-heading">
            <h2 id="product-gallery-heading" className="sr-only">
              その他の商品画像
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {product.images.slice(1, 5).map((image, index) => (
                <ProductVisual
                  className="aspect-square rounded-2xl"
                  image={image}
                  key={image}
                  name={`${product.name} 画像 ${index + 2}`}
                  sizes="(min-width: 640px) 25vw, 50vw"
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
