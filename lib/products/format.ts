import type { CurrencyCode } from "@/models";

export function formatProductPrice(price: number, currency: CurrencyCode): string {
  const fractionDigits = currency === "jpy" ? 0 : 2;
  const amount = currency === "jpy" ? price : price / 100;

  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function getStockLabel(stock: number): string {
  if (stock === 0) {
    return "暂时缺货";
  }

  if (stock <= 5) {
    return `仅剩 ${stock} 件`;
  }

  return "现货供应";
}
