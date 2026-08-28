import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";

const links = [
  { href: "/admin", label: "概要" },
  { href: "/admin/analytics", label: "売上分析" },
  { href: "/admin/products", label: "商品・在庫" },
  { href: "/admin/orders", label: "注文" },
  { href: "/admin/users", label: "ユーザー" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser("admin");
  return (
    <div className="min-h-[75vh] bg-stone-100">
      <div className="border-b border-stone-800 bg-stone-950 px-5 text-white sm:px-8 lg:px-12">
        <nav
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto py-3"
          aria-label="管理画面ナビゲーション"
        >
          {links.map((link) => (
            <Link
              className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-stone-300 hover:bg-white/10 hover:text-white"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
