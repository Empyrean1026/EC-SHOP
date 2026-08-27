import { CURRENCY_CODES, type CurrencyCode } from "@/models/constants";
import type { SalesTrendPoint } from "@/types/analytics";

export const ANALYTICS_TIMEZONE = "Asia/Tokyo";
export const DAILY_PERIOD_COUNT = 30;
export const MONTHLY_PERIOD_COUNT = 12;

export type PeriodRevenueRow = {
  period: string;
  currency: CurrencyCode;
  amount: number;
  orderCount: number;
};

function dateParts(value: Date, timezone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

function emptyRevenue(): Record<CurrencyCode, number> {
  return Object.fromEntries(CURRENCY_CODES.map((currency) => [currency, 0])) as Record<
    CurrencyCode,
    number
  >;
}

export function buildDailyPeriods(
  now: Date,
  timezone = ANALYTICS_TIMEZONE,
  count = DAILY_PERIOD_COUNT,
): { period: string; label: string }[] {
  const current = dateParts(now, timezone);
  const localDate = new Date(Date.UTC(current.year, current.month - 1, current.day));

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(localDate);
    date.setUTCDate(localDate.getUTCDate() - (count - index - 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return {
      period: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      label: `${month}月${day}日`,
    };
  });
}

export function buildMonthlyPeriods(
  now: Date,
  timezone = ANALYTICS_TIMEZONE,
  count = MONTHLY_PERIOD_COUNT,
): { period: string; label: string }[] {
  const current = dateParts(now, timezone);
  const localMonth = new Date(Date.UTC(current.year, current.month - 1, 1));

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(localMonth);
    date.setUTCMonth(localMonth.getUTCMonth() - (count - index - 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    return {
      period: `${year}-${String(month).padStart(2, "0")}`,
      label: `${year}年${month}月`,
    };
  });
}

export function fillSalesPeriods(
  periods: { period: string; label: string }[],
  rows: PeriodRevenueRow[],
): SalesTrendPoint[] {
  const points = new Map<string, SalesTrendPoint>(
    periods.map(({ period, label }) => [
      period,
      { period, label, orderCount: emptyRevenue(), revenue: emptyRevenue() },
    ]),
  );

  for (const row of rows) {
    const point = points.get(row.period);
    if (!point || !CURRENCY_CODES.includes(row.currency)) continue;
    point.revenue[row.currency] += row.amount;
    point.orderCount[row.currency] += row.orderCount;
  }

  return [...points.values()];
}
