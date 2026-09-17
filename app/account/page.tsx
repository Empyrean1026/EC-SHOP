import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/auth/dal";
import { getAccountDashboard, getAccountProfile } from "@/services/account-service";

export const metadata: Metadata = {
  title: "マイページ",
  description: "プロフィール、注文履歴、お届け先、お気に入りを管理します。",
};

export const dynamic = "force-dynamic";

const dashboardCards = [
  {
    href: "/account/orders",
    eyebrow: "Order history",
    title: "注文履歴",
    description: "お支払い状況、商品明細、配送状況を確認します。",
    metric: "orderCount" as const,
    unit: "件の注文",
  },
  {
    href: "/account/wishlist",
    eyebrow: "Wishlist",
    title: "お気に入り",
    description: "気になる商品を保存し、いつでも購入できます。",
    metric: "wishlistCount" as const,
    unit: "点の商品",
  },
];

export default async function AccountPage() {
  const user = await requireUser();
  const [profile, dashboard] = await Promise.all([
    getAccountProfile(user.id),
    getAccountDashboard(user.id),
  ]);

  if (!profile) return null;

  return (
    <section className="min-h-[75vh] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 rounded-[2rem] bg-stone-950 p-7 text-white sm:flex-row sm:items-end sm:p-10">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              こんにちは、{profile.name}
            </h1>
            <p className="mt-3 text-sm text-stone-400">{profile.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase">
              {profile.role}
            </span>
            <LogoutButton />
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {dashboardCards.map((card) => (
            <Link
              className="group rounded-3xl border border-stone-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 sm:p-8"
              href={card.href}
              key={card.href}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.15em] text-orange-600 uppercase">
                    {card.eyebrow}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
                    {card.title}
                  </h2>
                </div>
                <p className="text-right text-3xl font-semibold text-stone-950">
                  {dashboard[card.metric]}
                  <span className="mt-1 block text-[10px] font-medium tracking-wider text-stone-400 uppercase">
                    {card.unit}
                  </span>
                </p>
              </div>
              <p className="mt-6 text-sm leading-6 text-stone-500">{card.description}</p>
              <p className="mt-5 text-xs font-semibold text-stone-950 group-hover:text-orange-600">
                開く →
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Link
            className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8"
            href="/account/profile"
          >
            <p className="text-xs font-semibold tracking-[0.15em] text-stone-400 uppercase">
              Profile
            </p>
            <h2 className="mt-3 text-xl font-semibold text-stone-950">プロフィール</h2>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              氏名とプロフィール画像を更新し、アカウント情報を確認します。
            </p>
          </Link>
          <Link
            className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8"
            href="/account/address"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.15em] text-stone-400 uppercase">
                  Address
                </p>
                <h2 className="mt-3 text-xl font-semibold text-stone-950">既定のお届け先</h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                  dashboard.hasAddress
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {dashboard.hasAddress ? "登録済み" : "未登録"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              購入手続きで自動入力され、いつでも変更できます。
            </p>
          </Link>
        </div>

        {profile.role === "admin" ? (
          <Link
            className="mt-5 block rounded-3xl bg-[#dfe5ce] p-6 text-stone-950 sm:p-8 dark:bg-[#20271d]"
            href="/admin"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase">Administrator</p>
            <h2 className="mt-3 text-xl font-semibold">管理画面を開く</h2>
            <p className="mt-2 text-sm text-stone-600">
              商品、注文、在庫、ユーザー情報を管理します。
            </p>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
