import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  OrderProgress,
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/order-status";
import { ProductVisual } from "@/components/products/product-visual";
import { requireUser } from "@/lib/auth/dal";
import { formatProductPrice } from "@/lib/products/format";
import { getUserOrder } from "@/services/order-service";

export const metadata: Metadata = {
  title: "订单详情",
  description: "查看订单商品、付款状态、配送进度和收货地址。",
};

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const user = await requireUser();
  const order = await getUserOrder(user.id, (await params).id);
  if (!order) notFound();

  const canContinueStripePayment =
    order.paymentMethod === "stripe" &&
    !["paid", "partially_refunded", "refunded"].includes(order.paymentStatus) &&
    order.orderStatus !== "cancelled";

  return (
    <section className="min-h-[75vh] bg-stone-100 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-stone-950 p-7 text-white sm:p-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-orange-400 uppercase">
                Order detail
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                订单详情
              </h1>
              <p className="mt-4 text-xs break-all text-stone-400">订单号：{order.id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <OrderStatusBadge status={order.orderStatus} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>
          <div className="mt-8 rounded-2xl bg-white p-5 text-stone-950 sm:p-6">
            <OrderProgress status={order.orderStatus} />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-stone-950">商品明细</h2>
              <span className="text-xs text-stone-500">
                {order.items.length} 种 · {order.totalQuantity} 件
              </span>
            </div>
            <div className="mt-5 divide-y divide-stone-200">
              {order.items.map((item) => (
                <article
                  className="grid grid-cols-[4rem_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[4rem_minmax(0,1fr)_auto]"
                  key={item.productId}
                >
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
                    <p className="mt-2 text-sm font-semibold text-stone-950 sm:hidden">
                      {formatProductPrice(item.subtotal, order.currency)}
                    </p>
                  </div>
                  <p className="hidden text-right text-sm font-semibold text-stone-950 sm:block">
                    {formatProductPrice(item.subtotal, order.currency)}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-5 flex justify-between gap-4 border-t border-stone-200 pt-5">
              <p className="text-sm text-stone-500">订单总额</p>
              <p className="text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                {formatProductPrice(order.totalAmount, order.currency)}
              </p>
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="rounded-3xl border border-stone-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-stone-950">支付信息</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">支付方式</dt>
                  <dd className="font-semibold text-stone-900">
                    {order.paymentMethod === "stripe" ? "Stripe 在线支付" : "货到付款"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-stone-500">支付状态</dt>
                  <dd>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </dd>
                </div>
              </dl>
              {order.paidAt ? (
                <p className="mt-4 text-xs leading-5 text-stone-500">
                  确认时间：
                  {new Intl.DateTimeFormat("zh-CN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(order.paidAt))}
                </p>
              ) : null}
              {canContinueStripePayment ? (
                <Link
                  className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-full bg-orange-600 px-5 text-xs font-semibold text-white hover:bg-orange-700"
                  href={`/checkout/payment/${order.id}`}
                >
                  {order.paymentStatus === "failed" ? "重新支付" : "继续支付"}
                </Link>
              ) : null}
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-stone-950">收货地址</h2>
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

            <section className="rounded-3xl bg-[#dfe5ce] p-6 text-xs leading-6 text-stone-700">
              <p>
                创建：
                {new Intl.DateTimeFormat("zh-CN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(order.createdAt))}
              </p>
              <p>
                更新：
                {new Intl.DateTimeFormat("zh-CN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(order.updatedAt))}
              </p>
            </section>
          </aside>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white hover:bg-orange-600"
            href="/account/orders"
          >
            返回订单列表
          </Link>
          <Link
            className="inline-flex h-11 items-center rounded-full border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-800 hover:border-stone-950"
            href="/products"
          >
            继续购物
          </Link>
        </div>
      </div>
    </section>
  );
}
