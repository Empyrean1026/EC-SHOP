import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/auth/dal";
import { getAdminDashboardSummary } from "@/services/admin-service";

export const metadata: Metadata = {
  title: "管理画面",
  description: "売上データを確認し、商品、在庫、注文、ユーザーを管理します。",
};
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireUser("admin");
  const summary = await getAdminDashboardSummary();
  const cards = [
    {
      label: "すべての商品",
      value: summary.products,
      detail: `${summary.activeProducts} 点販売中`,
      href: "/admin/products",
    },
    {
      label: "残りわずか",
      value: summary.lowStockProducts,
      detail: "在庫5点以下",
      href: "/admin/products?stock=low",
    },
    {
      label: "すべての注文",
      value: summary.orders,
      detail: `${summary.openOrders} 件を処理中`,
      href: "/admin/orders",
    },
    {
      label: "登録ユーザー",
      value: summary.users,
      detail: "ユーザー一覧を見る",
      href: "/admin/users",
    },
  ];

  return (
    <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 rounded-[2rem] bg-stone-950 p-7 text-white sm:flex-row sm:items-end sm:p-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-orange-400 uppercase">
              Phase 11 / Admin dashboard
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              運用ダッシュボード
            </h1>
            <p className="mt-3 text-sm text-stone-400">
              {user.name} · 商品、注文処理、ユーザー情報の概要
            </p>
          </div>
          <div className="[&_button]:border-white/20 [&_button]:text-white">
            <LogoutButton />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              className="rounded-3xl border border-stone-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
              href={card.href}
              key={card.label}
            >
              <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                {card.label}
              </p>
              <p className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-stone-950">
                {card.value}
              </p>
              <p className="mt-2 text-xs text-stone-500">{card.detail}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link className="rounded-3xl bg-stone-950 p-7 text-white" href="/admin/analytics">
            <p className="text-xs font-semibold tracking-wider text-orange-400 uppercase">
              Sales analytics
            </p>
            <h2 className="mt-4 text-2xl font-semibold">売上データを見る</h2>
            <p className="mt-3 text-sm text-stone-400">
              売上、推移、注文数、人気商品を確認します。
            </p>
          </Link>
          <Link className="rounded-3xl bg-orange-600 p-7 text-white" href="/admin/products/new">
            <p className="text-xs font-semibold tracking-wider text-orange-100 uppercase">
              Product management
            </p>
            <h2 className="mt-4 text-2xl font-semibold">商品を登録</h2>
            <p className="mt-3 text-sm text-orange-100">
              商品を登録し、カテゴリー、価格、初期在庫を設定します。
            </p>
          </Link>
          <Link
            className="rounded-3xl bg-[#dfe5ce] p-7 text-stone-950 dark:bg-[#20271d]"
            href="/admin/orders"
          >
            <p className="text-xs font-semibold tracking-wider uppercase">Order management</p>
            <h2 className="mt-4 text-2xl font-semibold">未処理の注文を確認</h2>
            <p className="mt-3 text-sm text-stone-600">
              許可された順序で受付、発送、完了へ更新します。
            </p>
          </Link>
          <Link
            className="rounded-3xl border border-stone-200 bg-white p-7 text-stone-950"
            href="/admin/users"
          >
            <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
              User management
            </p>
            <h2 className="mt-4 text-2xl font-semibold">登録ユーザーを見る</h2>
            <p className="mt-3 text-sm text-stone-500">
              ユーザー、権限、お届け先の登録状況、注文数を確認します。
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
