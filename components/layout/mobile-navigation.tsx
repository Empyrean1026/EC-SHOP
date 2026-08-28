"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";

const navigation = [
  { href: "/products", label: "商品一覧", detail: "カテゴリーと在庫を見る" },
  { href: "/search", label: "検索", detail: "商品を検索" },
  { href: "/cart", label: "カート", detail: "商品と金額を確認" },
  { href: "/account/orders", label: "注文履歴", detail: "支払いと配送状況" },
  { href: "/account/wishlist", label: "お気に入り", detail: "気になる商品を保存" },
  { href: "/account", label: "マイページ", detail: "プロフィールとお届け先" },
];

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        aria-expanded={open}
        aria-label="メニューを開く"
        className="grid size-10 place-items-center rounded-full border border-stone-300 text-stone-700 lg:hidden dark:border-stone-700 dark:text-stone-200"
        onClick={() => setOpen(true)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <Modal
        description="商品、注文、アカウント機能へすばやく移動できます。"
        onClose={() => setOpen(false)}
        open={open}
        title="サイトナビゲーション"
      >
        <nav className="grid gap-2" aria-label="モバイルナビゲーション">
          {navigation.map((item) => (
            <Link
              className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 px-4 py-3 transition hover:border-orange-300 hover:bg-orange-50 dark:border-stone-700 dark:hover:bg-stone-800"
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              <span>
                <span className="block text-sm font-semibold text-stone-950">{item.label}</span>
                <span className="mt-1 block text-xs text-stone-500">{item.detail}</span>
              </span>
              <span className="text-stone-400" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </nav>
        <Link
          className="mt-5 flex h-11 items-center justify-center rounded-full bg-stone-950 text-sm font-semibold text-white"
          href="/login"
          onClick={() => setOpen(false)}
        >
          ログイン
        </Link>
      </Modal>
    </>
  );
}
