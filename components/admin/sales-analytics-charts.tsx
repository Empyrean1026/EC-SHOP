"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CURRENCY_CODES, type CurrencyCode } from "@/models/constants";
import { formatProductPrice } from "@/lib/products/format";
import type { SalesAnalytics, SalesTrendPoint } from "@/types/analytics";

const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  jpy: "JPY",
  usd: "USD",
  cny: "CNY",
};

function compactAmount(value: number, currency: CurrencyCode): string {
  const amount = currency === "jpy" ? value : value / 100;
  return new Intl.NumberFormat("ja-JP", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function trendData(points: SalesTrendPoint[], currency: CurrencyCode) {
  return points.map((point) => ({
    period: point.period,
    label: point.label,
    amount: point.revenue[currency],
    orderCount: point.orderCount[currency],
  }));
}

function SalesLineChart({
  points,
  currency,
  interval,
}: {
  points: SalesTrendPoint[];
  currency: CurrencyCode;
  interval: number;
}) {
  const data = useMemo(() => trendData(points, currency), [currency, points]);
  const hasRevenue = data.some((point) => point.amount > 0);

  if (!hasRevenue) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-stone-50 px-6 text-center text-sm text-stone-500">
        この期間には {CURRENCY_LABELS[currency]} 支払い済みの売上データがありません。
      </div>
    );
  }

  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label={`${CURRENCY_LABELS[currency]} 売上推移グラフ`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 10, bottom: 4, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid stroke="#e7e5e4" strokeDasharray="4 4" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            interval={interval}
            tick={{ fill: "#78716c", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            domain={[0, "auto"]}
            tick={{ fill: "#78716c", fontSize: 11 }}
            tickFormatter={(value: number) => compactAmount(value, currency)}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #e7e5e4",
              borderRadius: 16,
              boxShadow: "0 12px 30px rgb(28 25 23 / 0.1)",
            }}
            formatter={(value) => [formatProductPrice(Number(value), currency), "確定売上"]}
            labelFormatter={(label, payload) =>
              `${String(label)} · ${Number(payload[0]?.payload?.orderCount ?? 0)} 件の注文`
            }
          />
          <Line
            activeDot={{ fill: "#ea580c", r: 5, stroke: "#fff", strokeWidth: 2 }}
            dataKey="amount"
            dot={{ fill: "#ea580c", r: 2, strokeWidth: 0 }}
            stroke="#ea580c"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SalesAnalyticsCharts({ analytics }: { analytics: SalesAnalytics }) {
  const initialCurrency =
    analytics.summary.revenueByCurrency.find((item) => item.amount > 0)?.currency ?? "jpy";
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const topProductData = useMemo(
    () =>
      analytics.topProducts.map((product) => ({
        ...product,
        shortName: product.name.length > 12 ? `${product.name.slice(0, 12)}…` : product.name,
      })),
    [analytics.topProducts],
  );

  return (
    <>
      <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-orange-700 uppercase">
            Sales analytics
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            売上推移
          </h2>
          <p className="mt-2 text-sm text-stone-500">支払い確認日 · {analytics.timezone}</p>
        </div>
        <div
          className="inline-flex w-fit rounded-full border border-stone-200 bg-white p-1"
          aria-label="表示通貨"
        >
          {CURRENCY_CODES.map((code) => (
            <button
              aria-pressed={currency === code}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                currency === code
                  ? "bg-stone-950 text-white"
                  : "text-stone-500 hover:text-stone-950"
              }`}
              key={code}
              onClick={() => setCurrency(code)}
              type="button"
            >
              {CURRENCY_LABELS[code]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
          <h3 className="text-lg font-semibold text-stone-950">日次売上</h3>
          <p className="mt-1 text-xs text-stone-500">直近30日間 · {CURRENCY_LABELS[currency]}</p>
          <div className="mt-5">
            <SalesLineChart currency={currency} interval={4} points={analytics.dailySales} />
          </div>
        </article>

        <article className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
          <h3 className="text-lg font-semibold text-stone-950">月次売上</h3>
          <p className="mt-1 text-xs text-stone-500">直近12か月 · {CURRENCY_LABELS[currency]}</p>
          <div className="mt-5">
            <SalesLineChart currency={currency} interval={1} points={analytics.monthlySales} />
          </div>
        </article>
      </div>

      <article className="mt-4 rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h3 className="text-lg font-semibold text-stone-950">人気商品</h3>
            <p className="mt-1 text-xs text-stone-500">
              すべての支払い済み注文 · 販売点数順 · Top 5
            </p>
          </div>
          <p className="text-xs text-stone-500">金額：{CURRENCY_LABELS[currency]}</p>
        </div>

        {topProductData.length === 0 ? (
          <div className="mt-5 flex h-56 items-center justify-center rounded-2xl bg-stone-50 px-6 text-center text-sm text-stone-500">
            支払い済みの商品データはまだありません。テスト決済完了後にランキングが表示されます。
          </div>
        ) : (
          <>
            <div
              className="mt-5 h-72 w-full"
              role="img"
              aria-label="人気商品の販売点数を示す棒グラフ"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                  accessibilityLayer
                >
                  <CartesianGrid stroke="#e7e5e4" strokeDasharray="4 4" horizontal={false} />
                  <XAxis
                    axisLine={false}
                    allowDecimals={false}
                    domain={[0, "auto"]}
                    tick={{ fill: "#78716c", fontSize: 11 }}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="shortName"
                    tick={{ fill: "#44403c", fontSize: 12 }}
                    tickLine={false}
                    type="category"
                    width={98}
                  />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid #e7e5e4",
                      borderRadius: 16,
                      boxShadow: "0 12px 30px rgb(28 25 23 / 0.1)",
                    }}
                    formatter={(value) => [`${Number(value)} 点`, "販売点数"]}
                  />
                  <Bar dataKey="quantity" fill="#65734b" maxBarSize={32} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="text-xs text-stone-500">
                  <tr className="border-b border-stone-200">
                    <th className="pb-3 font-medium">順位</th>
                    <th className="pb-3 font-medium">商品</th>
                    <th className="pb-3 text-right font-medium">販売点数</th>
                    <th className="pb-3 text-right font-medium">注文</th>
                    <th className="pb-3 text-right font-medium">確定売上</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductData.map((product, index) => (
                    <tr className="border-b border-stone-100 last:border-0" key={product.productId}>
                      <td className="py-4 text-stone-400">{String(index + 1).padStart(2, "0")}</td>
                      <td className="py-4 font-medium text-stone-950">{product.name}</td>
                      <td className="py-4 text-right text-stone-700">{product.quantity} 点</td>
                      <td className="py-4 text-right text-stone-700">{product.orderCount} 件</td>
                      <td className="py-4 text-right font-medium text-stone-950">
                        {formatProductPrice(product.revenue[currency], currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </article>
    </>
  );
}
