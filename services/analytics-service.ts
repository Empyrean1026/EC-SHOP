import "server-only";

import { Types } from "mongoose";
import {
  ANALYTICS_TIMEZONE,
  buildDailyPeriods,
  buildMonthlyPeriods,
  fillSalesPeriods,
  type PeriodRevenueRow,
} from "@/lib/analytics/periods";
import { connectToDatabase } from "@/lib/mongodb";
import { CURRENCY_CODES, OrderModel, ProductModel, UserModel, type CurrencyCode } from "@/models";
import type { RevenueByCurrency, SalesAnalytics, TopSellingProduct } from "@/types/analytics";

type RevenueRow = { _id: CurrencyCode; amount: number; paidOrders: number };
type TrendRow = {
  _id: { period: string; currency: CurrencyCode };
  amount: number;
  orderCount: number;
};
type ProductRow = {
  _id: { productId: Types.ObjectId; name: string; currency: CurrencyCode };
  quantity: number;
  revenue: number;
  orderIds: Types.ObjectId[];
};

function currencyRecord(): Record<CurrencyCode, number> {
  return Object.fromEntries(CURRENCY_CODES.map((currency) => [currency, 0])) as Record<
    CurrencyCode,
    number
  >;
}

function toPeriodRows(rows: TrendRow[]): PeriodRevenueRow[] {
  return rows.map((row) => ({
    period: row._id.period,
    currency: row._id.currency,
    amount: row.amount,
    orderCount: row.orderCount,
  }));
}

function mergeTopProducts(rows: ProductRow[]): TopSellingProduct[] {
  const products = new Map<string, TopSellingProduct & { orderIds: Set<string> }>();

  for (const row of rows) {
    const productId = String(row._id.productId);
    const product = products.get(productId) ?? {
      productId,
      name: row._id.name,
      quantity: 0,
      orderCount: 0,
      revenue: currencyRecord(),
      orderIds: new Set<string>(),
    };
    product.quantity += row.quantity;
    product.revenue[row._id.currency] += row.revenue;
    row.orderIds.forEach((orderId) => product.orderIds.add(String(orderId)));
    product.orderCount = product.orderIds.size;
    products.set(productId, product);
  }

  return [...products.values()]
    .sort((left, right) => right.quantity - left.quantity || left.name.localeCompare(right.name))
    .slice(0, 5)
    .map((product) => ({
      productId: product.productId,
      name: product.name,
      quantity: product.quantity,
      orderCount: product.orderCount,
      revenue: product.revenue,
    }));
}

export async function getSalesAnalytics(now = new Date()): Promise<SalesAnalytics> {
  await connectToDatabase();
  const dailyPeriods = buildDailyPeriods(now);
  const monthlyPeriods = buildMonthlyPeriods(now);
  const dailyStart = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
  const monthlyStart = new Date(now.getTime() - 370 * 24 * 60 * 60 * 1000);
  const paidFilter = { paymentStatus: "paid" } as const;

  const [
    revenueRows,
    dailyRows,
    monthlyRows,
    productRows,
    totalOrders,
    paidOrders,
    users,
    products,
    activeProducts,
  ] = await Promise.all([
    OrderModel.aggregate<RevenueRow>([
      { $match: paidFilter },
      {
        $group: {
          _id: "$currency",
          amount: { $sum: "$totalAmount" },
          paidOrders: { $sum: 1 },
        },
      },
    ]),
    OrderModel.aggregate<TrendRow>([
      { $match: { ...paidFilter, paidAt: { $gte: dailyStart } } },
      {
        $group: {
          _id: {
            period: {
              $dateToString: {
                date: "$paidAt",
                format: "%Y-%m-%d",
                timezone: ANALYTICS_TIMEZONE,
              },
            },
            currency: "$currency",
          },
          amount: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
    ]),
    OrderModel.aggregate<TrendRow>([
      { $match: { ...paidFilter, paidAt: { $gte: monthlyStart } } },
      {
        $group: {
          _id: {
            period: {
              $dateToString: {
                date: "$paidAt",
                format: "%Y-%m",
                timezone: ANALYTICS_TIMEZONE,
              },
            },
            currency: "$currency",
          },
          amount: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
    ]),
    OrderModel.aggregate<ProductRow>([
      { $match: paidFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: { productId: "$items.productId", name: "$items.name", currency: "$currency" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
          orderIds: { $addToSet: "$_id" },
        },
      },
    ]),
    OrderModel.countDocuments(),
    OrderModel.countDocuments(paidFilter),
    UserModel.countDocuments(),
    ProductModel.countDocuments(),
    ProductModel.countDocuments({ isActive: true }),
  ]);

  const revenueByCurrency: RevenueByCurrency[] = CURRENCY_CODES.map((currency) => {
    const row = revenueRows.find((candidate) => candidate._id === currency);
    return { currency, amount: row?.amount ?? 0, paidOrders: row?.paidOrders ?? 0 };
  });

  return {
    generatedAt: now.toISOString(),
    timezone: ANALYTICS_TIMEZONE,
    summary: { revenueByCurrency, totalOrders, paidOrders, users, products, activeProducts },
    dailySales: fillSalesPeriods(dailyPeriods, toPeriodRows(dailyRows)),
    monthlySales: fillSalesPeriods(monthlyPeriods, toPeriodRows(monthlyRows)),
    topProducts: mergeTopProducts(productRows),
  };
}
