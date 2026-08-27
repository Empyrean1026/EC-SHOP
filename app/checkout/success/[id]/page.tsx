import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductVisual } from "@/components/products/product-visual";
import { getCurrentUser } from "@/lib/auth/dal";
import { formatProductPrice } from "@/lib/products/format";
import { getCheckoutOrder } from "@/services/checkout-service";

export const metadata: Metadata = {
  title: "订单已创建",
  description: "查看刚刚创建的订单。",
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
    ? "已选择货到付款，订单正在等待商家确认。"
    : isPaid
      ? "Stripe 签名 Webhook 已确认付款，订单已进入已付款状态。"
      : order.paymentStatus === "failed"
        ? "Stripe Webhook 已报告付款失败，你可以重新进入安全支付页。"
        : "支付尚未由 Stripe Webhook 最终确认，当前不会显示为已付款。";

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
            {isPaid ? "支付已安全确认" : "订单已安全创建"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300">{paymentMessage}</p>
          <div className="mt-7 flex flex-wrap gap-x-8 gap-y-2 text-xs text-stone-400">
            <p>订单号：{order.id}</p>
            <p>
              创建时间：
              {new Intl.DateTimeFormat("zh-CN", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(order.createdAt))}
            </p>
            {order.paidAt ? (
              <p>
                支付确认：
                {new Intl.DateTimeFormat("zh-CN", {
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
              <h2 className="text-xl font-semibold text-stone-950">商品明细</h2>
              <span className="text-xs text-stone-500">{order.items.length} 种商品</span>
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

            <section className="rounded-3xl bg-[#dfe5ce] p-6">
              <p className="text-xs text-stone-600">支付方式</p>
              <p className="mt-2 text-sm font-semibold text-stone-950">
                {isStripe ? "Stripe 在线支付" : "货到付款"}
              </p>
              <p className="mt-2 text-xs text-stone-600">状态：{order.paymentStatus}</p>
              <p className="mt-5 text-xs text-stone-600">订单总额</p>
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
              {order.paymentStatus === "failed" ? "重新支付" : "继续支付"}
            </Link>
          ) : null}
          <Link
            className="inline-flex h-11 items-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white hover:bg-orange-600"
            href={`/account/orders/${order.id}`}
          >
            查看订单详情
          </Link>
          <Link
            className="inline-flex h-11 items-center rounded-full border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-800 hover:border-stone-950"
            href="/account/orders"
          >
            查看全部订单
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
