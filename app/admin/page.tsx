import type { Metadata } from "next";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "管理员后台",
  description: "EC Site 管理员权限入口。",
};

export default async function AdminPage() {
  const user = await requireUser("admin");

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-stone-950 px-5 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-400 uppercase">
          Admin only / RBAC
        </p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em]">管理员后台</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-stone-400">
          {user.name} 已通过管理员角色校验。商品、库存、订单等管理模块将在后续阶段接入这里。
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {["JWT 已验证", "数据库角色已确认", "API 权限独立校验"].map((item, index) => (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5" key={item}>
              <span className="text-[10px] text-stone-600">0{index + 1}</span>
              <p className="mt-8 text-sm font-medium text-stone-200">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 [&_button]:border-white/20 [&_button]:text-white [&_button:hover]:border-white">
          <LogoutButton />
        </div>
      </div>
    </section>
  );
}
