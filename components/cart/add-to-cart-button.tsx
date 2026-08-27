"use client";

import { useState } from "react";
import { useCartStore } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import { CART_MAX_QUANTITY } from "@/lib/cart/constants";
import { useCartOperations } from "@/hooks/use-cart-operations";
import type { CartProductSnapshot } from "@/types/cart";

type AddToCartButtonProps = {
  product: CartProductSnapshot;
  compact?: boolean;
};

export function AddToCartButton({ product, compact = false }: AddToCartButtonProps) {
  const { addItem } = useCartOperations();
  const toast = useToast();
  const status = useCartStore((state) => state.status);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const maximum = Math.min(product.stock, CART_MAX_QUANTITY);
  const disabled = product.stock <= 0 || status !== "ready";

  async function add() {
    setMessage(null);
    const result = await addItem(product, compact ? 1 : quantity);
    setFailed(!result.success);
    setMessage(result.success ? null : result.message);
    if (result.success)
      toast.success("已加入购物车", `${product.name} × ${compact ? 1 : quantity}`);
    else toast.error("无法加入购物车", result.message);
  }

  if (compact) {
    return (
      <div className="mt-4 border-t border-stone-100 pt-4">
        <button
          className="h-9 w-full rounded-full border border-stone-300 text-xs font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={add}
          type="button"
        >
          {product.stock <= 0 ? "暂时缺货" : status === "syncing" ? "正在同步…" : "加入购物车"}
        </button>
        {message ? (
          <p
            className={`mt-2 text-center text-[11px] ${failed ? "text-red-600" : "text-emerald-700"}`}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex h-12 items-center justify-between rounded-full border border-stone-300 bg-white px-4 sm:w-36">
          <span className="text-xs font-semibold text-stone-500">数量</span>
          <select
            aria-label="加入购物车数量"
            className="bg-transparent text-sm font-semibold text-stone-950 outline-none"
            disabled={disabled}
            onChange={(event) => setQuantity(Number(event.target.value))}
            value={quantity}
          >
            {Array.from({ length: maximum }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button
          className="h-12 flex-1 rounded-full bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={add}
          type="button"
        >
          {product.stock <= 0
            ? "暂时缺货"
            : status === "initializing"
              ? "正在加载购物车…"
              : status === "syncing"
                ? "正在同步…"
                : "加入购物车"}
        </button>
      </div>
      {message ? (
        <p className={`mt-3 text-sm ${failed ? "text-red-700" : "text-emerald-700"}`} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
