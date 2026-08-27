"use client";

import Link from "next/link";
import { useCartStore } from "@/components/cart/cart-provider";

export function CartBadge() {
  const quantity = useCartStore((state) => state.totalQuantity);
  const hydrated = useCartStore((state) => state.hydrated);

  return (
    <Link
      className="relative grid size-9 place-items-center rounded-full border border-stone-300 bg-white text-stone-700 transition hover:border-stone-950 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
      href="/cart"
      aria-label={`购物车，${hydrated ? quantity : 0} 件商品`}
    >
      <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M3 4h2l1.7 10.2a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 1.9-1.4L21 7H6m3 13h.01M17 20h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
      {hydrated && quantity > 0 ? (
        <span className="absolute -top-1.5 -right-1.5 grid min-w-4.5 place-items-center rounded-full bg-orange-600 px-1 text-[9px] leading-[1.125rem] font-bold text-white">
          {quantity > 99 ? "99+" : quantity}
        </span>
      ) : null}
    </Link>
  );
}
