import Link from "next/link";
import { buildOrderHistoryUrl } from "@/lib/orders/url";
import type { OrderListQuery } from "@/lib/validations/order";
import type { PaginationMeta } from "@/types/product";

export function OrderPagination({
  pagination,
  query,
}: {
  pagination: PaginationMeta;
  query: OrderListQuery;
}) {
  if (pagination.totalPages <= 1) return null;

  const linkClassName =
    "rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950";

  return (
    <nav className="mt-10 flex items-center justify-between gap-4" aria-label="订单分页">
      {pagination.hasPreviousPage ? (
        <Link
          className={linkClassName}
          href={buildOrderHistoryUrl(query, { page: query.page - 1 })}
        >
          ← 上一页
        </Link>
      ) : (
        <span className={`${linkClassName} cursor-not-allowed opacity-40`}>← 上一页</span>
      )}
      <p className="text-xs text-stone-500">
        第 <strong className="text-stone-950">{pagination.page}</strong> / {pagination.totalPages}{" "}
        页
      </p>
      {pagination.hasNextPage ? (
        <Link
          className={linkClassName}
          href={buildOrderHistoryUrl(query, { page: query.page + 1 })}
        >
          下一页 →
        </Link>
      ) : (
        <span className={`${linkClassName} cursor-not-allowed opacity-40`}>下一页 →</span>
      )}
    </nav>
  );
}
