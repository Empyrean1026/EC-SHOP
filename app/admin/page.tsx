import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/auth/dal";
import { getAdminDashboardSummary } from "@/services/admin-service";

export const metadata: Metadata = {
  title: "管理员后台",
  description: "查看销售数据，管理商品、库存、订单和用户。",
};
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireUser("admin");
  const summary = await getAdminDashboardSummary();
  const cards = [
    {
      label: "全部商品",
      value: summary.products,
      detail: `${summary.activeProducts} 件上架`,
      href: "/admin/products",
    },
    {
      label: "低库存",
      value: summary.lowStockProducts,
      detail: "库存 5 件及以下",
      href: "/admin/products?stock=low",
    },
    {
      label: "全部订单",
      value: summary.orders,
      detail: `${summary.openOrders} 张履约中`,
      href: "/admin/orders",
    },
    { label: "注册用户", value: summary.users, detail: "查看账户列表", href: "/admin/users" },
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
              运营控制台
            </h1>
            <p className="mt-3 text-sm text-stone-400">{user.name} · 商品、履约与用户数据总览</p>
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
            <h2 className="mt-4 text-2xl font-semibold">查看销售数据</h2>
            <p className="mt-3 text-sm text-stone-400">销售额、趋势、订单规模与热销商品。</p>
          </Link>
          <Link className="rounded-3xl bg-orange-600 p-7 text-white" href="/admin/products/new">
            <p className="text-xs font-semibold tracking-wider text-orange-100 uppercase">
              Product management
            </p>
            <h2 className="mt-4 text-2xl font-semibold">添加新商品</h2>
            <p className="mt-3 text-sm text-orange-100">创建商品、设置分类、价格和初始库存。</p>
          </Link>
          <Link className="rounded-3xl bg-[#dfe5ce] p-7 text-stone-950" href="/admin/orders">
            <p className="text-xs font-semibold tracking-wider uppercase">Order management</p>
            <h2 className="mt-4 text-2xl font-semibold">处理待履约订单</h2>
            <p className="mt-3 text-sm text-stone-600">按合法状态机推进处理、发货和完成。</p>
          </Link>
          <Link
            className="rounded-3xl border border-stone-200 bg-white p-7 text-stone-950"
            href="/admin/users"
          >
            <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
              User management
            </p>
            <h2 className="mt-4 text-2xl font-semibold">查看注册用户</h2>
            <p className="mt-3 text-sm text-stone-500">检索用户、角色、地址配置和订单数量。</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
