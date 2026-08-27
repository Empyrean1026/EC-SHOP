"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";

const navigation = [
  { href: "/products", label: "商品目录", detail: "浏览分类与库存" },
  { href: "/search", label: "搜索", detail: "查找想要的商品" },
  { href: "/cart", label: "购物车", detail: "确认商品与金额" },
  { href: "/account/orders", label: "我的订单", detail: "付款与配送状态" },
  { href: "/account/wishlist", label: "收藏夹", detail: "保存喜欢的商品" },
  { href: "/account", label: "用户中心", detail: "资料、地址与账户" },
];

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        aria-expanded={open}
        aria-label="打开导航"
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
        description="快速前往购物、订单和账户功能。"
        onClose={() => setOpen(false)}
        open={open}
        title="站点导航"
      >
        <nav className="grid gap-2" aria-label="移动端主导航">
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
          登录账户
        </Link>
      </Modal>
    </>
  );
}
