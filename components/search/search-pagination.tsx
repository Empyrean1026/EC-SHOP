import Link from "next/link";
import { buildSearchUrl } from "@/lib/search/url";
import type { SearchQuery } from "@/lib/validations/search";
import type { PaginationMeta } from "@/types/product";

type SearchPaginationProps = {
  pagination: PaginationMeta;
  query: SearchQuery;
};

export function SearchPagination({ pagination, query }: SearchPaginationProps) {
  if (pagination.totalPages <= 1) return null;

  const linkClassName =
    "rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950";

  return (
    <nav className="mt-12 flex items-center justify-between gap-4" aria-label="搜索结果分页">
      {pagination.hasPreviousPage ? (
        <Link className={linkClassName} href={buildSearchUrl(query, { page: query.page - 1 })}>
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
        <Link className={linkClassName} href={buildSearchUrl(query, { page: query.page + 1 })}>
          下一页 →
        </Link>
      ) : (
        <span className={`${linkClassName} cursor-not-allowed opacity-40`}>下一页 →</span>
      )}
    </nav>
  );
}
