import Link from "next/link";
import { buildAdminPageUrl } from "@/lib/admin/url";
import type { PaginationMeta } from "@/types/product";

export function AdminPagination({
  path,
  query,
  pagination,
}: {
  path: string;
  query: Record<string, string | number | undefined>;
  pagination: PaginationMeta;
}) {
  if (pagination.totalPages <= 1) return null;
  const className = "rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold";

  return (
    <nav className="mt-8 flex items-center justify-between gap-3" aria-label="后台分页">
      {pagination.hasPreviousPage ? (
        <Link className={className} href={buildAdminPageUrl(path, query, pagination.page - 1)}>
          ← 上一页
        </Link>
      ) : (
        <span className={`${className} opacity-40`}>← 上一页</span>
      )}
      <p className="text-xs text-stone-500">
        第 {pagination.page} / {pagination.totalPages} 页
      </p>
      {pagination.hasNextPage ? (
        <Link className={className} href={buildAdminPageUrl(path, query, pagination.page + 1)}>
          下一页 →
        </Link>
      ) : (
        <span className={`${className} opacity-40`}>下一页 →</span>
      )}
    </nav>
  );
}
