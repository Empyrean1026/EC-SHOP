import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { requireUser } from "@/lib/auth/dal";
import { getUserWishlist } from "@/services/wishlist-service";

export const metadata: Metadata = { title: "我的收藏", description: "查看和管理收藏商品。" };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await requireUser();
  const wishlist = await getUserWishlist(user.id);

  return (
    <section className="min-h-[75vh] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Account / Wishlist
        </p>
        <div className="mt-3 flex flex-col justify-between gap-5 border-b border-stone-300 pb-8 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em] text-stone-950 sm:text-5xl">
              我的收藏
            </h1>
            <p className="mt-3 text-sm text-stone-500">
              已收藏 {wishlist.count} 件仍在销售的商品。
            </p>
          </div>
          <Link className="text-sm font-semibold text-stone-700 underline" href="/products">
            继续浏览商品
          </Link>
        </div>

        {wishlist.items.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.items.map((product) => (
              <ProductCard key={product.id} product={product} initialWishlisted />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid min-h-80 place-items-center rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-orange-600 uppercase">
                Empty wishlist
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
                还没有收藏商品
              </h2>
              <p className="mt-3 text-sm text-stone-500">
                在商品卡片或详情页点击“加入收藏”即可保存。
              </p>
              <Link
                className="mt-6 inline-flex h-11 items-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white"
                href="/products"
              >
                浏览商品
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
