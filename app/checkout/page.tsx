import Link from "next/link";
import { isShopDemo } from "@/lib/demo";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCurrentUser } from "@/lib/auth/dal";
import { getCheckoutPageData } from "@/services/checkout-service";

export const metadata: Metadata = {
  title: "購入手続き",
  description: "商品、お届け先、お支払い方法を確認して注文を確定します。",
};

export default async function CheckoutPage() {
  if (isShopDemo()) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-semibold">決済は現在ご利用いただけません</h1>
        <p className="my-6">
          このサイトは作品集用デモです。注文の作成・お支払いは行いません。商品とカートをご覧いただけます。
        </p>
        <Link href="/cart" className="underline">
          カートに戻る
        </Link>
      </section>
    );
  }
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");

  const initialData = await getCheckoutPageData(user.id, user.name);

  return (
    <section className="min-h-[75vh] bg-stone-100 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-stone-300 pb-10">
          <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
            Checkout
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] text-stone-950 sm:text-6xl">
            ご注文内容の確認
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            お届け先とお支払い方法をご確認ください。商品、在庫、金額はサーバー側で再計算します。
          </p>
        </div>

        <div className="mt-8">
          <CheckoutForm initialData={initialData} />
        </div>
      </div>
    </section>
  );
}
