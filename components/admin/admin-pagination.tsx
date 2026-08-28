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
    <nav className="mt-8 flex items-center justify-between gap-3" aria-label="管理画面のページ送り">
      {pagination.hasPreviousPage ? (
        <Link className={className} href={buildAdminPageUrl(path, query, pagination.page - 1)}>
          ← 前へ
        </Link>
      ) : (
        <span className={`${className} opacity-40`}>← 前へ</span>
      )}
      <p className="text-xs text-stone-500">
        {pagination.page} / {pagination.totalPages} ページ
      </p>
      {pagination.hasNextPage ? (
        <Link className={className} href={buildAdminPageUrl(path, query, pagination.page + 1)}>
          次へ →
        </Link>
      ) : (
        <span className={`${className} opacity-40`}>次へ →</span>
      )}
    </nav>
  );
}
