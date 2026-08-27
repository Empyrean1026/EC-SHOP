import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";

const accountNavigation = [
  { href: "/account", label: "概览" },
  { href: "/account/profile", label: "个人资料" },
  { href: "/account/orders", label: "订单" },
  { href: "/account/address", label: "地址" },
  { href: "/account/wishlist", label: "收藏夹" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="bg-stone-100">
      <div className="border-b border-stone-200 bg-white px-5 sm:px-8 lg:px-12">
        <nav
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto py-3"
          aria-label="用户中心导航"
        >
          {accountNavigation.map((item) => (
            <Link
              className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-950"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
