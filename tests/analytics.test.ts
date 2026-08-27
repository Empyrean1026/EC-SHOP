import assert from "node:assert/strict";
import test from "node:test";
import { buildDailyPeriods, buildMonthlyPeriods, fillSalesPeriods } from "@/lib/analytics/periods";

test("analytics periods follow the configured timezone at a UTC date boundary", () => {
  const now = new Date("2026-08-26T16:30:00.000Z");

  assert.deepEqual(buildDailyPeriods(now, "Asia/Tokyo", 3), [
    { period: "2026-08-25", label: "8月25日" },
    { period: "2026-08-26", label: "8月26日" },
    { period: "2026-08-27", label: "8月27日" },
  ]);
  assert.deepEqual(buildMonthlyPeriods(now, "Asia/Tokyo", 3), [
    { period: "2026-06", label: "2026年6月" },
    { period: "2026-07", label: "2026年7月" },
    { period: "2026-08", label: "2026年8月" },
  ]);
});

test("sales series fill missing periods and keep currencies separate", () => {
  const periods = [
    { period: "2026-08-26", label: "8月26日" },
    { period: "2026-08-27", label: "8月27日" },
  ];
  const result = fillSalesPeriods(periods, [
    { period: "2026-08-27", currency: "jpy", amount: 6800, orderCount: 1 },
    { period: "2026-08-27", currency: "usd", amount: 1999, orderCount: 2 },
    { period: "2026-08-28", currency: "jpy", amount: 500, orderCount: 1 },
  ]);

  assert.deepEqual(result, [
    {
      period: "2026-08-26",
      label: "8月26日",
      orderCount: { jpy: 0, usd: 0, cny: 0 },
      revenue: { jpy: 0, usd: 0, cny: 0 },
    },
    {
      period: "2026-08-27",
      label: "8月27日",
      orderCount: { jpy: 1, usd: 2, cny: 0 },
      revenue: { jpy: 6800, usd: 1999, cny: 0 },
    },
  ]);
});
