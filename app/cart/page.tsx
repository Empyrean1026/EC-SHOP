import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "カート",
  description: "EC Siteのカート内容を確認・管理します。",
};

export default function CartPage() {
  return (
    <section className="min-h-[75vh] bg-stone-100 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-stone-300 pb-10">
          <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
            Phase 06 / Shopping cart
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] text-stone-950 sm:text-6xl">
            カート
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-stone-600">
            商品価格と在庫をリアルタイムで確認します。ゲストのカートは端末に保存され、ログイン後にアカウントへ統合されます。
          </p>
        </div>

        <div className="mt-8">
          <CartPageClient />
        </div>
      </div>
    </section>
  );
}
