import type { Metadata } from "next";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "用户中心",
  description: "查看当前登录账户。",
};

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-stone-100 px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Protected route
        </p>
        <div className="mt-5 rounded-[2rem] border border-stone-200 bg-white p-7 shadow-xl shadow-stone-900/5 sm:p-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
            <div>
              <div className="grid size-14 place-items-center rounded-full bg-stone-950 text-lg font-semibold text-white">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-stone-950">
                {user.name}
              </h1>
              <p className="mt-2 text-stone-600">{user.email}</p>
            </div>
            <span className="w-fit rounded-full bg-[#dfe5ce] px-4 py-2 text-xs font-semibold tracking-wider text-stone-800 uppercase">
              {user.role}
            </span>
          </div>

          <div className="mt-10 border-t border-stone-200 pt-8">
            <h2 className="text-sm font-semibold text-stone-950">会话安全</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              当前页面同时经过 Proxy 的 JWT 快速校验和数据访问层的数据库身份校验。
            </p>
            <div className="mt-6">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
