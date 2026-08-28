import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import {
  OrderProgress,
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/order-status";
import { ProductVisual } from "@/components/products/product-visual";
import { getAllowedAdminOrderTransitions } from "@/lib/admin/order-status";
import { requireUser } from "@/lib/auth/dal";
import { formatProductPrice } from "@/lib/products/format";
import { getAdminOrder } from "@/services/admin-service";

export const metadata: Metadata = { title: "注文を処理" };
export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("admin");
  const order = await getAdminOrder((await params).id);
  if (!order) notFound();
  const allowed = getAllowedAdminOrderTransitions(
    order.orderStatus,
    order.paymentStatus,
    order.paymentMethod,
  );
  const address = order.shippingAddress;

  return (
    <section className="px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link className="text-sm font-semibold text-stone-600 underline" href="/admin/orders">
          ← 注文管理に戻る
        </Link>
        <div className="mt-6 rounded-[2rem] bg-stone-950 p-7 text-white sm:p-9">
          <p className="text-xs font-semibold tracking-[0.18em] text-orange-400 uppercase">
            Admin / Fulfillment
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">注文を処理</h1>
          <p className="mt-3 text-xs break-all text-stone-400">{order.id}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <OrderStatusBadge status={order.orderStatus} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-stone-950">配送状況</h2>
              <div className="mt-6">
                <OrderProgress status={order.orderStatus} />
              </div>
              <div className="mt-6 border-t border-stone-200 pt-5">
                <OrderStatusForm orderId={order.id} allowed={allowed} />
              </div>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">商品明細</h2>
                <p className="font-semibold">
                  {formatProductPrice(order.totalAmount, order.currency)}
                </p>
              </div>
              <div className="mt-5 space-y-4">
                {order.items.map((item) => (
                  <div
                    className="flex items-center gap-4 border-t border-stone-100 pt-4"
                    key={item.productId}
                  >
                    <ProductVisual
                      className="aspect-square size-16 shrink-0 rounded-xl"
                      image={item.image ?? undefined}
                      name={item.name}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatProductPrice(item.unitPrice, order.currency)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatProductPrice(item.subtotal, order.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="space-y-6">
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-semibold">お客様</h2>
              <p className="mt-4 text-sm font-semibold">
                {order.customer?.name ?? "削除済みアカウント"}
              </p>
              <p className="mt-1 text-xs break-all text-stone-500">
                {order.customer?.email ?? "—"}
              </p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-semibold">お届け先</h2>
              <address className="mt-4 text-sm leading-7 text-stone-600 not-italic">
                <strong className="text-stone-950">{address.fullName}</strong>
                <br />
                {address.phone}
                <br />
                {address.postalCode}
                <br />
                {address.state ? `${address.state} ` : ""}
                {address.city}
                <br />
                {address.line1}
                {address.line2 ? (
                  <>
                    <br />
                    {address.line2}
                  </>
                ) : null}
                <br />
                {address.country}
              </address>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-semibold">支払い</h2>
              <p className="mt-4 text-sm text-stone-600">
                お支払い方法：{order.paymentMethod === "stripe" ? "Stripe" : "代金引換"}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                支払い確認日時：
                {order.paidAt
                  ? new Intl.DateTimeFormat("ja-JP", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(order.paidAt))
                  : "未確認"}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
