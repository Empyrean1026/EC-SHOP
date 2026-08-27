import type { Metadata } from "next";
import Link from "next/link";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { InventoryEditor } from "@/components/admin/inventory-editor";
import { ProductDeleteButton } from "@/components/admin/product-delete-button";
import { requireUser } from "@/lib/auth/dal";
import { formatProductPrice } from "@/lib/products/format";
import { adminProductListQuerySchema } from "@/lib/validations/admin";
import { listAdminProducts } from "@/services/admin-service";

export const metadata: Metadata = { title: "商品与库存管理" };
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
              商品与库存
            </h1>
            <p className="mt-3 text-sm text-stone-500">
              共 {result.pagination.total} 件符合条件的商品。
            </p>
          </div>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-orange-600 px-6 text-sm font-semibold text-white"
            href="/admin/products/new"
          >
            ＋ 添加商品
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
            placeholder="名称或 Slug"
          />
          <select
            className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
            name="status"
            defaultValue={query.status}
          >
            <option value="all">全部状态</option>
            <option value="active">已上架</option>
            <option value="inactive">已下架</option>
          </select>
          <select
            className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
            name="stock"
            defaultValue={query.stock}
          >
            <option value="all">全部库存</option>
            <option value="in_stock">库存充足</option>
            <option value="low">低库存</option>
            <option value="out_of_stock">缺货</option>
          </select>
          <select
            className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
            name="sort"
            defaultValue={query.sort}
          >
            <option value="newest">最新创建</option>
            <option value="name">名称</option>
            <option value="stock_asc">库存升序</option>
            <option value="stock_desc">库存降序</option>
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
                      {product.isActive ? "上架" : "下架"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-stone-500">
                    {product.slug} · {product.category?.name ?? "未分类"}
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
                    编辑
                  </Link>
                  {product.isActive ? <ProductDeleteButton productId={product.id} /> : null}
                </div>
              </article>
            ))
          ) : (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div>
                <h2 className="text-2xl font-semibold text-stone-950">没有符合条件的商品</h2>
                <p className="mt-2 text-sm text-stone-500">尝试清除筛选或添加新商品。</p>
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
