import type { CurrencyCode } from "@/models/constants";

export type RevenueByCurrency = {
  currency: CurrencyCode;
  amount: number;
  paidOrders: number;
};

export type SalesTrendPoint = {
  period: string;
  label: string;
  orderCount: Record<CurrencyCode, number>;
  revenue: Record<CurrencyCode, number>;
};

export type TopSellingProduct = {
  productId: string;
  name: string;
  quantity: number;
  orderCount: number;
  revenue: Record<CurrencyCode, number>;
};

export type SalesAnalytics = {
  generatedAt: string;
  timezone: string;
  summary: {
    revenueByCurrency: RevenueByCurrency[];
    totalOrders: number;
    paidOrders: number;
    users: number;
    products: number;
    activeProducts: number;
  };
  dailySales: SalesTrendPoint[];
  monthlySales: SalesTrendPoint[];
  topProducts: TopSellingProduct[];
};
