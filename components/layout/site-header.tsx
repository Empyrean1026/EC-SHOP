import Link from "next/link";

const navigation = [
  { href: "#foundation", label: "工程基线" },
  { href: "#architecture", label: "架构" },
  { href: "#next", label: "后续模块" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f5f3ee]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link
          className="flex items-center gap-3 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-950"
          href="/"
          aria-label="EC Site 首页"
        >
          <span className="grid size-8 place-items-center rounded-full bg-stone-950 text-[10px] font-bold tracking-wider text-white">
            EC
          </span>
          <span className="text-sm font-bold tracking-[0.2em] text-stone-950">SITE</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="主导航">
          {navigation.map((item) => (
            <a
              className="text-xs font-medium text-stone-600 transition hover:text-stone-950 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-950"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <span className="rounded-full border border-stone-300 px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-stone-600 uppercase">
          Phase 01
        </span>
      </div>
    </header>
  );
}
