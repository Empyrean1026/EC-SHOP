import type { Metadata } from "next";
import { SalesAnalyticsChartsLazy } from "@/components/admin/sales-analytics-charts-lazy";
import { requireUser } from "@/lib/auth/dal";
import { formatProductPrice } from "@/lib/products/format";
import { getSalesAnalytics } from "@/services/analytics-service";

export const metadata: Metadata = {
  title: "数据统计 | 管理员后台",
  description: "查看销售额、订单、用户、商品和热销商品统计。",
};
export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireUser("admin");
  const analytics = await getSalesAnalytics();
  const generatedAt = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: analytics.timezone,
  }).format(new Date(analytics.generatedAt));

  const cards = [
    {
      label: "总订单",
      value: analytics.summary.totalOrders.toLocaleString("zh-CN"),
      detail: `${analytics.summary.paidOrders.toLocaleString("zh-CN")} 张已付款`,
    },
    {
      label: "用户数量",
      value: analytics.summary.users.toLocaleString("zh-CN"),
      detail: "全部注册账户",
    },
    {
      label: "商品数量",
      value: analytics.summary.products.toLocaleString("zh-CN"),
      detail: `${analytics.summary.activeProducts.toLocaleString("zh-CN")} 件上架`,
    },
  ];

  return (
    <section className="px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-orange-700 uppercase">
              Phase 12 / Analytics
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-stone-950 sm:text-5xl">
              数据统计
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
              以服务端已确认付款订单为销售口径，按付款确认时间展示趋势与商品表现。
            </p>
          </div>
          <p className="text-xs text-stone-500">更新于 {generatedAt}</p>
        </div>

        <article className="mt-7 rounded-[2rem] bg-stone-950 p-7 text-white sm:p-9">
          <p className="text-xs font-semibold tracking-[0.18em] text-orange-400 uppercase">
            Confirmed revenue
          </p>
          <h2 className="mt-3 text-xl font-semibold">总销售额</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {analytics.summary.revenueByCurrency.map((item) => (
              <div className="rounded-2xl bg-white/8 p-5" key={item.currency}>
                <p className="text-xs font-semibold tracking-wider text-stone-400 uppercase">
                  {item.currency}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                  {formatProductPrice(item.amount, item.currency)}
                </p>
                <p className="mt-2 text-xs text-stone-400">{item.paidOrders} 张已付款订单</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-stone-400">
            各币种独立统计，不进行跨币种换算；退款订单不计入当前已确认销售额。
          </p>
        </article>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <article className="rounded-3xl border border-stone-200 bg-white p-6" key={card.label}>
              <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                {card.label}
              </p>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-stone-950">
                {card.value}
              </p>
              <p className="mt-2 text-xs text-stone-500">{card.detail}</p>
            </article>
          ))}
        </div>

        <SalesAnalyticsChartsLazy analytics={analytics} />

        <aside className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-xs leading-5 text-stone-500">
          数据源：MongoDB 的订单、用户和商品集合。销售额仅包含 `paymentStatus = paid`；日/月趋势按
          `paidAt` 归属到 {analytics.timezone}
          ，当前未存储部分退款金额，因此部分退款订单不计入销售额。
        </aside>
      </div>
    </section>
  );
}
