import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PaymentStatusWatcher } from "@/components/payment/payment-status-watcher";
import { getCurrentUser } from "@/lib/auth/dal";
import { getCheckoutOrder } from "@/services/checkout-service";

export const metadata: Metadata = {
  title: "お支払い状況を確認",
  description: "Stripe Webhookによるお支払い結果の確認を待ちます。",
};

type PaymentReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentReturnPage({ searchParams }: PaymentReturnPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rawOrderId = (await searchParams).orderId;
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
  if (!orderId) notFound();

  const order = await getCheckoutOrder(user.id, orderId);
  if (!order || order.paymentMethod !== "stripe") notFound();
  if (order.paymentStatus === "paid") redirect(`/checkout/success/${order.id}`);

  return (
    <section className="min-h-[75vh] bg-stone-100 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-3xl rounded-3xl border border-stone-200 bg-white p-7 sm:p-10">
        <PaymentStatusWatcher orderId={order.id} initialStatus={order.paymentStatus} />
        <p className="mt-8 border-t border-stone-200 pt-5 text-xs break-all text-stone-400">
          注文番号：{order.id}
        </p>
      </div>
    </section>
  );
}
