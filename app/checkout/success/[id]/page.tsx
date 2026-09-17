import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductVisual } from "@/components/products/product-visual";
import { getCurrentUser } from "@/lib/auth/dal";
import { formatProductPrice } from "@/lib/products/format";
import { getCheckoutOrder } from "@/services/checkout-service";

export const metadata: Metadata = {
  title: "ご注文を受け付けました",
  description: "作成した注文の内容を確認します。",
};

type CheckoutSuccessPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CheckoutSuccessPage({ params }: CheckoutSuccessPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const order = await getCheckoutOrder(user.id, (await params).id);
  if (!order) notFound();

  const isStripe = order.paymentMethod === "stripe";
  const isPaid = order.paymentStatus === "paid";
  const paymentMessage = !isStripe
    ? "代金引換を選択しました。ショップが注文内容を確認しています。"
    : isPaid
      ? "お支払いを確認しました。注文は支払い済みです。"
      : order.paymentStatus === "failed"
        ? "お支払いを確認できませんでした。決済画面からもう一度お試しください。"
        : "決済サービスによる最終確認が完了していないため、現在は確認中です。";

  return (
    <section className="min-h-[75vh] bg-stone-100 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-stone-950 p-7 text-white sm:p-10">
          <span
            className={`grid size-12 place-items-center rounded-full text-2xl text-stone-950 ${
              isPaid || !isStripe ? "bg-emerald-400" : "bg-orange-400"
            }`}
            aria-hidden="true"
          >
            {isPaid || !isStripe ? "✓" : "·"}
          </span>
          <p className="mt-6 text-xs font-semibold tracking-[0.18em] text-orange-400 uppercase">
            {isPaid ? "Payment verified" : "Order created"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {isPaid ? "お支払いを確認しました" : "ご注文を受け付けました"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300">{paymentMessage}</p>
          <div className="mt-7 flex flex-wrap gap-x-8 gap-y-2 text-xs text-stone-400">
            <p>注文番号：{order.id}</p>
            <p>
              注文日時：
              {new Intl.DateTimeFormat("ja-JP", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(order.createdAt))}
            </p>
            {order.paidAt ? (
              <p>
                支払い確認：
                {new Intl.DateTimeFormat("ja-JP", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(order.paidAt))}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-stone-950">商品明細</h2>
              <span className="text-xs text-stone-500">{order.items.length} 種類の商品</span>
            </div>
            <div className="mt-5 divide-y divide-stone-200">
              {order.items.map((item) => (
                <article className="grid grid-cols-[4rem_1fr_auto] gap-4 py-5" key={item.productId}>
                  <ProductVisual
                    className="aspect-square rounded-xl"
                    image={item.image ?? undefined}
                    name={item.name}
                  />
                  <div className="min-w-0">
                    <Link
                      className="font-semibold text-stone-950 hover:text-orange-600"
                      href={`/products/${item.productId}`}
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-stone-500">
                      {formatProductPrice(item.unitPrice, order.currency)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-right text-sm font-semibold text-stone-950">
                    {formatProductPrice(item.subtotal, order.currency)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-stone-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-stone-950">お届け先</h2>
              <address className="mt-4 text-sm leading-7 text-stone-600 not-italic">
                <p className="font-semibold text-stone-900">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
                <p>
                  {[order.shippingAddress.city, order.shippingAddress.state]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p>
                  {order.shippingAddress.postalCode} · {order.shippingAddress.country}
                </p>
              </address>
            </section>

            <section className="rounded-3xl bg-[#dfe5ce] p-6 dark:bg-[#20271d]">
              <p className="text-xs text-stone-600">お支払い方法</p>
              <p className="mt-2 text-sm font-semibold text-stone-950">
                {isStripe ? "クレジットカード（Stripe）" : "代金引換"}
              </p>
              <p className="mt-2 text-xs text-stone-600">状況：{order.paymentStatus}</p>
              <p className="mt-5 text-xs text-stone-600">注文合計</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                {formatProductPrice(order.totalAmount, order.currency)}
              </p>
            </section>
          </aside>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {isStripe && !isPaid ? (
            <Link
              className="inline-flex h-11 items-center rounded-full bg-orange-600 px-6 text-sm font-semibold text-white hover:bg-orange-700"
              href={`/checkout/payment/${order.id}`}
            >
              {order.paymentStatus === "failed" ? "もう一度支払う" : "支払いを続ける"}
            </Link>
          ) : null}
          <Link
            className="inline-flex h-11 items-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white hover:bg-orange-600"
            href={`/account/orders/${order.id}`}
          >
            注文詳細を見る
          </Link>
          <Link
            className="inline-flex h-11 items-center rounded-full border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-800 hover:border-stone-950"
            href="/account/orders"
          >
            注文履歴を見る
          </Link>
          <Link
            className="inline-flex h-11 items-center rounded-full border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-800 hover:border-stone-950"
            href="/products"
          >
            買い物を続ける
          </Link>
        </div>
      </div>
    </section>
  );
}
