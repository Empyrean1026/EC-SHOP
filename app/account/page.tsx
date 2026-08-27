import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/auth/dal";
import { getAccountDashboard, getAccountProfile } from "@/services/account-service";

export const metadata: Metadata = {
  title: "用户中心",
  description: "管理个人资料、订单、地址与收藏夹。",
};

export const dynamic = "force-dynamic";

const dashboardCards = [
  {
    href: "/account/orders",
    eyebrow: "Order history",
    title: "我的订单",
    description: "查看付款状态、商品明细和配送进度。",
    metric: "orderCount" as const,
    unit: "张订单",
  },
  {
    href: "/account/wishlist",
    eyebrow: "Wishlist",
    title: "我的收藏",
    description: "保存感兴趣的商品，随时返回购买。",
    metric: "wishlistCount" as const,
    unit: "件商品",
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
            <p className="text-xs font-semibold tracking-[0.18em] text-orange-400 uppercase">
              Phase 10 / User dashboard
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              你好，{profile.name}
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
                打开 →
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
            <h2 className="mt-3 text-xl font-semibold text-stone-950">个人资料</h2>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              更新姓名与头像，查看账户身份信息。
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
                <h2 className="mt-3 text-xl font-semibold text-stone-950">默认收货地址</h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                  dashboard.hasAddress
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {dashboard.hasAddress ? "已设置" : "待完善"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              结算时可自动填入，也可以随时修改。
            </p>
          </Link>
        </div>

        {profile.role === "admin" ? (
          <Link
            className="mt-5 block rounded-3xl bg-[#dfe5ce] p-6 text-stone-950 sm:p-8"
            href="/admin"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase">Administrator</p>
            <h2 className="mt-3 text-xl font-semibold">进入管理员后台</h2>
            <p className="mt-2 text-sm text-stone-600">
              下一阶段将集中完善商品、订单、库存和用户管理。
            </p>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
