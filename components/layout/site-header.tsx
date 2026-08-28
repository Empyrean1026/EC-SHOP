import Link from "next/link";
import { CartBadge } from "@/components/cart/cart-badge";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navigation = [
  { href: "/products", label: "商品一覧" },
  { href: "/search", label: "検索" },
  { href: "/cart", label: "カート" },
  { href: "/account/orders", label: "注文履歴" },
  { href: "/account/wishlist", label: "お気に入り" },
  { href: "/#foundation", label: "技術構成" },
];

export function SiteHeader() {
  return (
    <header className="bg-background/90 sticky top-0 z-50 border-b border-black/10 backdrop-blur-xl dark:border-white/10">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link
          className="flex items-center gap-3 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-950"
          href="/"
          aria-label="EC Site トップページ"
        >
          <span className="grid size-8 place-items-center rounded-full bg-stone-950 text-[10px] font-bold tracking-wider text-white">
            EC
          </span>
          <span className="text-sm font-bold tracking-[0.2em] text-stone-950">SITE</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="メインナビゲーション">
          {navigation.map((item) => (
            <Link
              className="text-xs font-medium text-stone-600 transition hover:text-stone-950 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-950"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            className="hidden rounded-full px-3 py-2 text-xs font-semibold text-stone-600 transition hover:text-stone-950 md:block"
            href="/login"
          >
            ログイン
          </Link>
          <ThemeToggle />
          <CartBadge />
          <Link
            className="hidden rounded-full border border-stone-300 px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-stone-600 uppercase transition hover:border-stone-950 hover:text-stone-950 sm:block"
            href="/account"
          >
            Phase 13
          </Link>
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
