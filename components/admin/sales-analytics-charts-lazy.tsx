"use client";

import dynamic from "next/dynamic";
import type { SalesAnalytics } from "@/types/analytics";

const LazySalesAnalyticsCharts = dynamic(
  () =>
    import("@/components/admin/sales-analytics-charts").then(
      (module) => module.SalesAnalyticsCharts,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="mt-8 space-y-4" aria-label="正在加载销售图表" role="status">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-stone-200" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-96 animate-pulse rounded-3xl bg-stone-100" />
          <div className="h-96 animate-pulse rounded-3xl bg-stone-100" />
        </div>
      </div>
    ),
  },
);

export function SalesAnalyticsChartsLazy({ analytics }: { analytics: SalesAnalytics }) {
  return <LazySalesAnalyticsCharts analytics={analytics} />;
}
