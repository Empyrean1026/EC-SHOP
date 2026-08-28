import Link from "next/link";
import { buildProductsUrl } from "@/lib/products/url";
import type { ProductListQuery } from "@/lib/validations/product";
import type { PaginationMeta } from "@/types/product";

type ProductPaginationProps = {
  pagination: PaginationMeta;
  query: ProductListQuery;
};

export function ProductPagination({ pagination, query }: ProductPaginationProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const linkClassName =
    "rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950";

  return (
    <nav
      className="mt-12 flex items-center justify-between gap-4"
      aria-label="商品一覧のページ送り"
    >
      {pagination.hasPreviousPage ? (
        <Link className={linkClassName} href={buildProductsUrl(query, { page: query.page - 1 })}>
          ← 前へ
        </Link>
      ) : (
        <span className={`${linkClassName} cursor-not-allowed opacity-40`}>← 前へ</span>
      )}

      <p className="text-xs text-stone-500">
        <strong className="text-stone-950">{pagination.page}</strong> / {pagination.totalPages}{" "}
        ページ
      </p>

      {pagination.hasNextPage ? (
        <Link className={linkClassName} href={buildProductsUrl(query, { page: query.page + 1 })}>
          次へ →
        </Link>
      ) : (
        <span className={`${linkClassName} cursor-not-allowed opacity-40`}>次へ →</span>
      )}
    </nav>
  );
}
