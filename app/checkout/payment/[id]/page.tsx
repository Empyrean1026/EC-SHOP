import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StripePaymentPanel } from "@/components/payment/stripe-payment-panel";
import { getCurrentUser } from "@/lib/auth/dal";
import { formatProductPrice } from "@/lib/products/format";
import { getStripePublishableKey, StripeConfigurationError } from "@/lib/stripe/server";
import { getCheckoutOrder } from "@/services/checkout-service";

export const metadata: Metadata = {
  title: "カードでお支払い",
  description: "安全な決済画面で注文のお支払いを完了します。",
};

type PaymentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PaymentPage({ params }: PaymentPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const order = await getCheckoutOrder(user.id, (await params).id);
  if (!order) notFound();
  if (order.paymentMethod !== "stripe") redirect(`/checkout/success/${order.id}`);
  if (order.paymentStatus === "paid") redirect(`/checkout/success/${order.id}`);

  let publishableKey: string | null = null;
  try {
    publishableKey = getStripePublishableKey();
  } catch (error) {
    if (!(error instanceof StripeConfigurationError)) throw error;
  }

  return (
    <section className="min-h-[75vh] bg-stone-100 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-orange-600 uppercase">
            Secure payment
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl">
            Stripe でお支払い
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            カード情報を入力してお支払いを完了してください。お支払い状況は決済サービスで確認後に更新されます。
          </p>
          <div className="mt-8">
            <StripePaymentPanel order={order} publishableKey={publishableKey} />
          </div>
        </div>

        <aside className="rounded-3xl bg-stone-950 p-6 text-white lg:sticky lg:top-24">
          <p className="text-xs font-semibold tracking-[0.16em] text-orange-400 uppercase">
            Payment summary
          </p>
          <p className="mt-5 text-xs break-all text-stone-400">注文番号 {order.id}</p>
          <dl className="mt-6 space-y-3 border-t border-white/15 pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-400">商品の種類</dt>
              <dd>{order.items.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-400">お支払い状況</dt>
              <dd>{order.paymentStatus}</dd>
            </div>
          </dl>
          <div className="mt-6 border-t border-white/15 pt-5">
            <p className="text-xs text-stone-400">お支払い金額</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {formatProductPrice(order.totalAmount, order.currency)}
            </p>
          </div>
          <Link
            className="mt-6 inline-block text-xs text-stone-400 underline"
            href={`/checkout/success/${order.id}`}
          >
            後で支払う・注文を確認
          </Link>
        </aside>
      </div>
    </section>
  );
}
