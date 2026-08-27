import type { Metadata } from "next";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { requireUser } from "@/lib/auth/dal";
import { adminUserListQuerySchema } from "@/lib/validations/admin";
import { listAdminUsers } from "@/services/admin-service";

export const metadata: Metadata = { title: "用户管理" };
export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const firstValues = (values: Record<string, string | string[] | undefined>) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireUser("admin");
  const parsed = adminUserListQuerySchema.safeParse(firstValues(await searchParams));
  const query = parsed.success ? parsed.data : adminUserListQuerySchema.parse({});
  const result = await listAdminUsers(query);

  return (
    <section className="px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Admin / Users
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950">用户管理</h1>
        <p className="mt-3 text-sm text-stone-500">
          只读查看用户账户，共 {result.pagination.total} 位。
        </p>
        <form
          className="mt-7 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:grid-cols-4"
          method="get"
        >
          <input
            className="h-11 rounded-xl border border-stone-300 px-3 text-sm"
            name="q"
            defaultValue={query.q}
            placeholder="姓名或邮箱"
          />
          <select
            className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
            name="role"
            defaultValue={query.role ?? ""}
          >
            <option value="">全部角色</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
            name="sort"
            defaultValue={query.sort}
          >
            <option value="newest">最新注册</option>
            <option value="oldest">最早注册</option>
            <option value="name">姓名</option>
          </select>
          <button
            className="h-11 rounded-full bg-stone-950 px-5 text-xs font-semibold text-white"
            type="submit"
          >
            应用筛选
          </button>
        </form>
        {!parsed.success ? (
          <p className="mt-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
            查询参数无效，已恢复默认条件。
          </p>
        ) : null}
        <div className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white">
          {result.items.length ? (
            result.items.map((user) => (
              <article
                className="grid gap-4 border-b border-stone-200 p-5 last:border-0 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_10rem] sm:items-center"
                key={user.id}
              >
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-stone-950">{user.name}</h2>
                  <p className="mt-1 truncate text-xs text-stone-500">{user.email}</p>
                  <p className="mt-2 text-[10px] text-stone-400">
                    注册于{" "}
                    {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(
                      new Date(user.createdAt),
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 uppercase">角色</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-violet-100 text-violet-800" : "bg-stone-100 text-stone-700"}`}
                  >
                    {user.role}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 uppercase">订单</p>
                  <p className="mt-1 font-semibold">{user.orderCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 uppercase">默认地址</p>
                  <p className="mt-1 text-sm font-semibold">
                    {user.hasAddress ? "已设置" : "未设置"}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="grid min-h-64 place-items-center text-stone-500">
              没有符合条件的用户。
            </div>
          )}
        </div>
        <AdminPagination
          path="/admin/users"
          query={{ q: query.q, role: query.role, sort: query.sort, limit: query.limit }}
          pagination={result.pagination}
        />
      </div>
    </section>
  );
}
