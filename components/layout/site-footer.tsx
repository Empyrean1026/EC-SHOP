import Link from "next/link";

const footerNavigation = [
  { href: "/products", label: "商品一覧" },
  { href: "/search", label: "商品検索" },
  { href: "/account", label: "マイページ" },
  { href: "/about", label: "このデモについて" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-stone-950 text-stone-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto] md:items-start lg:px-12">
        <div className="max-w-xl">
          <Link
            className="inline-flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400"
            href="/"
          >
            <span className="grid size-8 place-items-center rounded-full bg-white text-[10px] font-bold tracking-wider text-stone-950">
              EC
            </span>
            <span className="text-sm font-bold tracking-[0.2em] text-white">SITE</span>
          </Link>
          <p className="mt-5 text-sm leading-7 text-stone-400">
            日常生活、デスクワーク、自宅での運動に役立つアイテムを紹介するポートフォリオ用ECデモです。実際の注文・決済は行われません。
          </p>
        </div>

        <nav
          className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm"
          aria-label="フッターナビゲーション"
        >
          {footerNavigation.map((item) => (
            <Link className="transition hover:text-white" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          <a
            className="transition hover:text-white"
            href="https://github.com/Empyrean1026/EC-SHOP"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <a
            className="transition hover:text-white"
            href="https://lixuanjian.com"
            rel="noreferrer"
            target="_blank"
          >
            ポートフォリオ
          </a>
        </nav>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-stone-500 sm:px-8">
        EC Site — Portfolio demonstration
      </div>
    </footer>
  );
}
