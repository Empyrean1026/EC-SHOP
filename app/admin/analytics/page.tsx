import type { Metadata } from "next";
import { SalesAnalyticsChartsLazy } from "@/components/admin/sales-analytics-charts-lazy";
import { requireUser } from "@/lib/auth/dal";
import { formatProductPrice } from "@/lib/products/format";
import { getSalesAnalytics } from "@/services/analytics-service";

export const metadata: Metadata = {
  title: "売上分析 | 管理画面",
  description: "売上、注文、ユーザー、商品、人気商品の集計を確認します。",
};
export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireUser("admin");
  const analytics = await getSalesAnalytics();
  const generatedAt = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: analytics.timezone,
  }).format(new Date(analytics.generatedAt));

  const cards = [
    {
      label: "注文総数",
      value: analytics.summary.totalOrders.toLocaleString("ja-JP"),
      detail: `${analytics.summary.paidOrders.toLocaleString("ja-JP")} 件が支払い済み`,
    },
    {
      label: "ユーザー数",
      value: analytics.summary.users.toLocaleString("ja-JP"),
      detail: "登録アカウント総数",
    },
    {
      label: "商品数",
      value: analytics.summary.products.toLocaleString("ja-JP"),
      detail: `${analytics.summary.activeProducts.toLocaleString("ja-JP")} 点販売中`,
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
              売上分析
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
              サーバー側で支払い確認済みの注文を基準に、売上推移と商品実績を表示します。
            </p>
          </div>
          <p className="text-xs text-stone-500">更新日時 {generatedAt}</p>
        </div>

        <article className="mt-7 rounded-[2rem] bg-stone-950 p-7 text-white sm:p-9">
          <p className="text-xs font-semibold tracking-[0.18em] text-orange-400 uppercase">
            Confirmed revenue
          </p>
          <h2 className="mt-3 text-xl font-semibold">売上合計</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {analytics.summary.revenueByCurrency.map((item) => (
              <div className="rounded-2xl bg-white/8 p-5" key={item.currency}>
                <p className="text-xs font-semibold tracking-wider text-stone-400 uppercase">
                  {item.currency}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                  {formatProductPrice(item.amount, item.currency)}
                </p>
                <p className="mt-2 text-xs text-stone-400">{item.paidOrders} 件の支払い済み注文</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-stone-400">
            通貨ごとに集計し、通貨間の換算は行いません。返金済みの注文は確定売上に含まれません。
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
          データソースはMongoDBの注文、ユーザー、商品コレクションです。売上には `paymentStatus =
          paid` の注文のみを含め、日次・月次の推移は `paidAt` を基準に {analytics.timezone}
          で集計します。部分返金額は現在保存していないため、部分返金の注文は売上に含めません。
        </aside>
      </div>
    </section>
  );
}
