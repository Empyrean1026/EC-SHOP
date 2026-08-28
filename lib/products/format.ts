import type { CurrencyCode } from "@/models";

export function formatProductPrice(price: number, currency: CurrencyCode): string {
  const fractionDigits = currency === "jpy" ? 0 : 2;
  const amount = currency === "jpy" ? price : price / 100;

  const formatted = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);

  return currency === "jpy" ? formatted.replace("￥", "¥") : formatted;
}

export function getStockLabel(stock: number): string {
  if (stock === 0) {
    return "在庫切れ";
  }

  if (stock <= 5) {
    return `残り${stock} 点`;
  }

  return "在庫あり";
}
