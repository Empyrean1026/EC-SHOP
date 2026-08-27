"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductVisual } from "@/components/products/product-visual";
import { useCartStore, useCartStoreApi } from "@/components/cart/cart-provider";
import { formatProductPrice } from "@/lib/products/format";
import { useCartOperations } from "@/hooks/use-cart-operations";
import type { CartLine } from "@/types/cart";

function CartLineItem({ item }: { item: CartLine }) {
  const { setQuantity, removeItem } = useCartOperations();
  const status = useCartStore((state) => state.status);
  const [message, setMessage] = useState<string | null>(null);
  const disabled = status !== "ready";

  async function changeQuantity(quantity: number) {
    setMessage(null);
    const result = await setQuantity(item.product.id, quantity);
    if (!result.success) setMessage(result.message);
  }

  async function remove() {
    setMessage(null);
    const result = await removeItem(item.product.id);
    if (!result.success) setMessage(result.message);
  }

  return (
    <article className="grid gap-5 border-b border-stone-200 py-6 last:border-0 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center">
      <Link
        className="block overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        href={`/products/${item.product.slug}`}
      >
        <ProductVisual
          className="aspect-square w-full"
          image={item.product.image ?? undefined}
          name={item.product.name}
        />
      </Link>

      <div className="min-w-0">
        <Link
          className="text-lg font-semibold tracking-[-0.025em] text-stone-950 transition hover:text-orange-600"
          href={`/products/${item.product.slug}`}
        >
          {item.product.name}
        </Link>
        <p className="mt-1 text-sm text-stone-500">
          单价 {formatProductPrice(item.product.price, item.product.currency)}
        </p>
        <p className="mt-1 text-xs text-stone-400">当前库存 {item.product.stock} 件</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 items-center rounded-full border border-stone-300 bg-white">
            <button
              aria-label={`减少 ${item.product.name} 数量`}
              className="grid size-10 place-items-center text-lg text-stone-600 transition hover:text-orange-600 disabled:opacity-30"
              disabled={disabled || item.quantity <= 1}
              onClick={() => changeQuantity(item.quantity - 1)}
              type="button"
            >
              −
            </button>
            <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">
              {item.quantity}
            </span>
            <button
              aria-label={`增加 ${item.product.name} 数量`}
              className="grid size-10 place-items-center text-lg text-stone-600 transition hover:text-orange-600 disabled:opacity-30"
              disabled={disabled || item.quantity >= item.product.stock || item.quantity >= 99}
              onClick={() => changeQuantity(item.quantity + 1)}
              type="button"
            >
              +
            </button>
          </div>
          <button
            className="text-xs text-stone-500 underline-offset-4 transition hover:text-red-700 hover:underline disabled:opacity-40"
            disabled={disabled}
            onClick={remove}
            type="button"
          >
            删除
          </button>
        </div>
        {message ? (
          <p className="mt-3 text-xs text-red-700" role="alert">
            {message}
          </p>
        ) : null}
      </div>

      <p className="text-right text-lg font-semibold text-stone-950">
        {formatProductPrice(item.subtotal, item.product.currency)}
      </p>
    </article>
  );
}

export function CartPageClient() {
  const store = useCartStoreApi();
  const items = useCartStore((state) => state.items);
  const totals = useCartStore((state) => state.totals);
  const totalQuantity = useCartStore((state) => state.totalQuantity);
  const source = useCartStore((state) => state.source);
  const status = useCartStore((state) => state.status);
  const error = useCartStore((state) => state.error);
  const adjustments = useCartStore((state) => state.adjustments);
  const { clearCart } = useCartOperations();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);

  async function clear() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }

    const result = await clearCart();
    setConfirmClear(false);
    setClearMessage(result.success ? null : result.message);
  }

  if (status === "initializing") {
    return (
      <div className="grid min-h-80 place-items-center rounded-3xl border border-stone-200 bg-white">
        <p className="text-sm text-stone-500" role="status">
          正在加载购物车…
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        {adjustments.length > 0 ? (
          <p
            className="mb-5 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            购物车内的商品已因下架或缺货自动移除。
          </p>
        ) : null}
        {error ? (
          <div
            className="mb-5 flex items-start justify-between gap-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p>{error}</p>
            <button
              className="shrink-0 text-xs font-semibold underline"
              onClick={() => store.getState().setError(null)}
              type="button"
            >
              关闭
            </button>
          </div>
        ) : null}
        <div className="grid min-h-[28rem] place-items-center rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <div>
            <span
              className="mx-auto grid size-14 place-items-center rounded-full bg-stone-100 text-2xl"
              aria-hidden="true"
            >
              🛒
            </span>
            <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-orange-600 uppercase">
              Your cart is empty
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
              还没有加入商品
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-stone-500">
              从商品目录选择喜欢的物件，库存和金额会在加入时自动校验。
            </p>
            <Link
              className="mt-7 inline-flex h-11 items-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-orange-600"
              href="/products"
            >
              浏览商品
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div>
        {adjustments.length > 0 ? (
          <p
            className="mb-5 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            部分商品已因下架、缺货或库存变化自动调整，请确认后再结算。
          </p>
        ) : null}
        {error ? (
          <div
            className="mb-5 flex items-start justify-between gap-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p>{error}</p>
            <button
              className="shrink-0 text-xs font-semibold underline"
              onClick={() => store.getState().setError(null)}
              type="button"
            >
              关闭
            </button>
          </div>
        ) : null}

        <div className="rounded-3xl border border-stone-200 bg-white px-5 sm:px-7">
          {items.map((item) => (
            <CartLineItem item={item} key={item.product.id} />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            {source === "account" ? "已同步至你的账户" : "游客购物车 · 保存在当前浏览器"}
          </p>
          <div className="flex items-center gap-3">
            {confirmClear ? (
              <button
                className="text-xs text-stone-500 underline-offset-4 hover:underline"
                onClick={() => setConfirmClear(false)}
                type="button"
              >
                取消
              </button>
            ) : null}
            <button
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition disabled:opacity-40 ${
                confirmClear
                  ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-stone-300 text-stone-600 hover:border-red-500 hover:text-red-700"
              }`}
              disabled={status !== "ready"}
              onClick={clear}
              type="button"
            >
              {confirmClear ? "确认清空" : "清空购物车"}
            </button>
          </div>
        </div>
        {clearMessage ? (
          <p className="mt-3 text-right text-xs text-red-700" role="alert">
            {clearMessage}
          </p>
        ) : null}
      </div>

      <aside className="rounded-3xl bg-stone-950 p-6 text-white lg:sticky lg:top-24">
        <p className="text-xs font-semibold tracking-[0.16em] text-orange-400 uppercase">
          Order summary
        </p>
        <dl className="mt-8 space-y-4 border-b border-white/15 pb-6 text-sm">
          <div className="flex justify-between gap-4 text-stone-400">
            <dt>商品数量</dt>
            <dd className="font-semibold text-white">{totalQuantity} 件</dd>
          </div>
          <div className="flex justify-between gap-4 text-stone-400">
            <dt>商品种类</dt>
            <dd className="font-semibold text-white">{items.length} 种</dd>
          </div>
        </dl>
        <div className="space-y-3 pt-6">
          <p className="text-xs text-stone-400">总金额</p>
          {totals.map((total) => (
            <p className="text-2xl font-semibold tracking-[-0.03em]" key={total.currency}>
              {formatProductPrice(total.amount, total.currency)}
            </p>
          ))}
        </div>

        <button
          className="mt-8 h-12 w-full cursor-not-allowed rounded-full bg-white/15 text-sm font-semibold text-stone-400"
          disabled
          type="button"
        >
          结算将在后续阶段开放
        </button>

        {source === "guest" ? (
          <p className="mt-5 text-xs leading-5 text-stone-400">
            <Link
              className="font-semibold text-white underline underline-offset-4"
              href="/login?next=/cart"
            >
              登录账户
            </Link>
            后会把当前购物车与云端购物车合并。
          </p>
        ) : null}
      </aside>
    </div>
  );
}
