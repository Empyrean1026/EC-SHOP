import type { Metadata } from "next";
import Link from "next/link";
import { OrderPagination } from "@/components/orders/order-pagination";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status";
import { ProductVisual } from "@/components/products/product-visual";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/dal";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orders/status";
import { formatProductPrice } from "@/lib/products/format";
import { orderListQuerySchema } from "@/lib/validations/order";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/models/constants";
import { listUserOrders } from "@/services/order-service";

export const metadata: Metadata = {
  title: "注文履歴",
  description: "注文履歴、お支払い状況、配送状況を確認します。",
};

export const dynamic = "force-dynamic";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValues(values: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await requireUser();
  const parsed = orderListQuerySchema.safeParse(firstValues(await searchParams));
  const query = parsed.success ? parsed.data : orderListQuerySchema.parse({});
  const result = await listUserOrders(user.id, query);

  return (
    <section className="min-h-[75vh] bg-stone-100 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 border-b border-stone-300 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
              Phase 09 / Order history
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950 sm:text-5xl">
              注文履歴
            </h1>
            <p className="mt-3 text-sm text-stone-500">
              お支払いと配送の状況を確認できます。全{result.pagination.total}件の注文があります。
            </p>
          </div>
          <Link className="text-sm font-semibold text-stone-700 underline" href="/account">
            マイページに戻る
          </Link>
        </div>

        <form
          className="mt-7 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-4"
          method="get"
        >
          <label className="text-xs font-semibold text-stone-600">
            注文状況
            <select
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900"
              defaultValue={query.status ?? ""}
              name="status"
            >
              <option value="">すべてのステータス</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-stone-600">
            お支払い状況
            <select
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900"
              defaultValue={query.paymentStatus ?? ""}
              name="paymentStatus"
            >
              <option value="">すべてのお支払い状況</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PAYMENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-stone-600">
            並び順
            <select
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900"
              defaultValue={query.sort}
              name="sort"
            >
              <option value="newest">注文日の新しい順</option>
              <option value="oldest">注文日の古い順</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              className="h-11 flex-1 rounded-full bg-stone-950 px-4 text-xs font-semibold text-white hover:bg-orange-600"
              type="submit"
            >
              絞り込む
            </button>
            <Link
              className="grid h-11 place-items-center rounded-full border border-stone-300 px-4 text-xs font-semibold text-stone-700"
              href="/account/orders"
            >
              クリア
            </Link>
          </div>
        </form>

        {!parsed.success ? (
          <p className="mt-5 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
            一部の検索条件が正しくないため、既定の条件に戻しました。
          </p>
        ) : null}

        {result.items.length > 0 ? (
          <div className="mt-7 space-y-5">
            {result.items.map((order) => (
              <article
                className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7"
                key={order.id}
              >
                <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs break-all text-stone-500">注文番号 {order.id}</p>
                    <p className="mt-2 text-xs text-stone-400">
                      {new Intl.DateTimeFormat("ja-JP", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(order.createdAt))}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <OrderStatusBadge status={order.orderStatus} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex shrink-0 -space-x-3">
                      {order.items.slice(0, 3).map((item) => (
                        <ProductVisual
                          className="aspect-square size-14 rounded-xl border-2 border-white"
                          image={item.image ?? undefined}
                          key={item.productId}
                          name={item.name}
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-950">
                        {order.items.map((item) => item.name).join("、")}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {order.itemCount} 種類 · 合計 {order.totalQuantity} 点
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 lg:block lg:text-right">
                    <p className="text-lg font-semibold text-stone-950">
                      {formatProductPrice(order.totalAmount, order.currency)}
                    </p>
                    <Link
                      className="mt-2 inline-flex h-9 items-center rounded-full border border-stone-300 px-4 text-xs font-semibold text-stone-800 hover:border-stone-950"
                      href={`/account/orders/${order.id}`}
                    >
                      詳細を見る
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7">
            <EmptyState
              actionHref="/products"
              actionLabel="商品を見る"
              description="絞り込みを解除するか、商品一覧からお買い物をお楽しみください。"
              eyebrow="No orders"
              icon="□"
              title="条件に一致する注文はありません"
            />
          </div>
        )}

        <OrderPagination pagination={result.pagination} query={query} />
      </div>
    </section>
  );
}
