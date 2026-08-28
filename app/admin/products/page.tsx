import type { Metadata } from "next";
import Link from "next/link";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { InventoryEditor } from "@/components/admin/inventory-editor";
import { ProductDeleteButton } from "@/components/admin/product-delete-button";
import { requireUser } from "@/lib/auth/dal";
import { formatProductPrice } from "@/lib/products/format";
import { adminProductListQuerySchema } from "@/lib/validations/admin";
import { listAdminProducts } from "@/services/admin-service";

export const metadata: Metadata = { title: "商品・在庫管理" };
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const firstValues = (values: Record<string, string | string[] | undefined>) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );

export default async function AdminProductsPage({ searchParams }: PageProps) {
  await requireUser("admin");
  const parsed = adminProductListQuerySchema.safeParse(firstValues(await searchParams));
  const query = parsed.success ? parsed.data : adminProductListQuerySchema.parse({});
  const result = await listAdminProducts(query);

  return (
    <section className="px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
              Admin / Products
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950">
              商品・在庫
            </h1>
            <p className="mt-3 text-sm text-stone-500">
              全 {result.pagination.total} 点の商品が見つかりました。
            </p>
          </div>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-orange-600 px-6 text-sm font-semibold text-white"
            href="/admin/products/new"
          >
            ＋ 商品を登録
          </Link>
        </div>

        <form
          className="mt-7 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:grid-cols-5"
          method="get"
        >
          <input
            className="h-11 rounded-xl border border-stone-300 px-3 text-sm"
            name="q"
            defaultValue={query.q}
            placeholder="商品名またはSlug"
          />
          <select
            className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
            name="status"
            defaultValue={query.status}
          >
            <option value="all">すべてのステータス</option>
            <option value="active">販売中</option>
            <option value="inactive">販売停止</option>
          </select>
          <select
            className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
            name="stock"
            defaultValue={query.stock}
          >
            <option value="all">すべての在庫状況</option>
            <option value="in_stock">在庫あり</option>
            <option value="low">残りわずか</option>
            <option value="out_of_stock">在庫切れ</option>
          </select>
          <select
            className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
            name="sort"
            defaultValue={query.sort}
          >
            <option value="newest">登録日の新しい順</option>
            <option value="name">商品名</option>
            <option value="stock_asc">在庫の少ない順</option>
            <option value="stock_desc">在庫の多い順</option>
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

        <div className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white">
          {result.items.length ? (
            result.items.map((product) => (
              <article
                className="grid gap-5 border-b border-stone-200 p-5 last:border-0 lg:grid-cols-[minmax(0,1fr)_12rem_16rem] lg:items-center"
                key={product.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-stone-950">
                      {product.name}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${product.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"}`}
                    >
                      {product.isActive ? "販売中" : "販売停止"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-stone-500">
                    {product.slug} · {product.category?.name ?? "カテゴリーなし"}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-stone-950">
                    {formatProductPrice(product.price, product.currency)}
                  </p>
                </div>
                <InventoryEditor productId={product.id} stock={product.stock} />
                <div className="flex items-center gap-4 lg:justify-end">
                  <Link
                    className="text-xs font-semibold text-stone-800 underline"
                    href={`/admin/products/${product.id}/edit`}
                  >
                    編集
                  </Link>
                  {product.isActive ? <ProductDeleteButton productId={product.id} /> : null}
                </div>
              </article>
            ))
          ) : (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div>
                <h2 className="text-2xl font-semibold text-stone-950">
                  条件に一致する商品はありません
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  絞り込みを解除するか、商品を登録してください。
                </p>
              </div>
            </div>
          )}
        </div>

        <AdminPagination
          path="/admin/products"
          query={{
            q: query.q,
            status: query.status,
            stock: query.stock,
            sort: query.sort,
            limit: query.limit,
          }}
          pagination={result.pagination}
        />
      </div>
    </section>
  );
}
