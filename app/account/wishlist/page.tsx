import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/dal";
import { getUserWishlist } from "@/services/wishlist-service";

export const metadata: Metadata = {
  title: "お気に入り",
  description: "お気に入りの商品を確認・管理します。",
};
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
              お気に入り
            </h1>
            <p className="mt-3 text-sm text-stone-500">
              お気に入りに {wishlist.count} 点の商品を登録しています。
            </p>
          </div>
          <Link className="text-sm font-semibold text-stone-700 underline" href="/products">
            買い物を続ける
          </Link>
        </div>

        {wishlist.items.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.items.map((product) => (
              <ProductCard key={product.id} product={product} initialWishlisted />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              actionHref="/products"
              actionLabel="商品を見る"
              description="商品カードまたは商品詳細で「お気に入りに追加」を押すと保存できます。"
              eyebrow="Empty wishlist"
              icon="♡"
              title="お気に入りの商品はありません"
            />
          </div>
        )}
      </div>
    </section>
  );
}
