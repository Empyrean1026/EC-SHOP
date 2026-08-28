import type { Metadata } from "next";
import Link from "next/link";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status";
import { requireUser } from "@/lib/auth/dal";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orders/status";
import { formatProductPrice } from "@/lib/products/format";
import { adminOrderListQuerySchema } from "@/lib/validations/admin";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/models";
import { listAdminOrders } from "@/services/admin-service";

export const metadata: Metadata = { title: "注文管理" };
export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const firstValues = (values: Record<string, string | string[] | undefined>) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireUser("admin");
  const parsed = adminOrderListQuerySchema.safeParse(firstValues(await searchParams));
  const query = parsed.success ? parsed.data : adminOrderListQuerySchema.parse({});
  const result = await listAdminOrders(query);

  return (
    <section className="px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Admin / Orders
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950">注文管理</h1>
        <p className="mt-3 text-sm text-stone-500">
          全 {result.pagination.total} 件の注文が見つかりました。
        </p>
        <form
          className="mt-7 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:grid-cols-5"
          method="get"
        >
          <input
            className="h-11 rounded-xl border border-stone-300 px-3 text-sm"
            name="q"
            defaultValue={query.q}
            placeholder="注文番号・氏名・メールアドレス"
          />
          <select
            className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
            name="status"
            defaultValue={query.status ?? ""}
          >
            <option value="">すべての注文状況</option>
            {ORDER_STATUSES.map((status) => (
              <option value={status} key={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
            name="paymentStatus"
            defaultValue={query.paymentStatus ?? ""}
          >
            <option value="">すべてのお支払い状況</option>
            {PAYMENT_STATUSES.map((status) => (
              <option value={status} key={status}>
                {PAYMENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
            name="sort"
            defaultValue={query.sort}
          >
            <option value="newest">注文日の新しい順</option>
            <option value="oldest">注文日の古い順</option>
          </select>
          <button
            className="h-11 rounded-full bg-stone-950 px-5 text-xs font-semibold text-white"
            type="submit"
          >
            絞り込む
          </button>
        </form>
        {!parsed.success ? (
          <p className="mt-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
            検索条件が正しくないため、既定の条件に戻しました。
          </p>
        ) : null}
        <div className="mt-6 space-y-4">
          {result.items.length ? (
            result.items.map((order) => (
              <article
                className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6"
                key={order.id}
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0">
                    <p className="text-xs break-all text-stone-500">{order.id}</p>
                    <h2 className="mt-2 truncate font-semibold text-stone-950">
                      {order.customer?.name ?? "削除済みアカウント"}
                    </h2>
                    <p className="mt-1 truncate text-xs text-stone-500">
                      {order.customer?.email ?? "—"} ·{" "}
                      {new Intl.DateTimeFormat("ja-JP", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(order.createdAt))}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={order.orderStatus} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <span className="ml-2 text-lg font-semibold">
                      {formatProductPrice(order.totalAmount, order.currency)}
                    </span>
                    <Link
                      className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold"
                      href={`/admin/orders/${order.id}`}
                    >
                      注文を処理
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-stone-300 bg-white">
              <p className="text-stone-500">条件に一致する注文はありません。</p>
            </div>
          )}
        </div>
        <AdminPagination
          path="/admin/orders"
          query={{
            q: query.q,
            status: query.status,
            paymentStatus: query.paymentStatus,
            sort: query.sort,
            limit: query.limit,
          }}
          pagination={result.pagination}
        />
      </div>
    </section>
  );
}
