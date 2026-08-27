import type { Metadata } from "next";
import { CategoryNavigation, ProductFilters } from "@/components/products/product-filters";
import { ProductCard } from "@/components/products/product-card";
import { ProductPagination } from "@/components/products/product-pagination";
import { productListQuerySchema } from "@/lib/validations/product";
import { getCurrentUser } from "@/lib/auth/dal";
import { listCategories, listProducts } from "@/services/product-service";
import { getWishlistProductIds } from "@/services/wishlist-service";

export const metadata: Metadata = {
  title: "商品目录",
  description: "浏览、搜索和筛选 EC Site 商品。",
};

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParamValues(
  searchParams: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const parsed = productListQuerySchema.safeParse(firstSearchParamValues(await searchParams));
  const query = parsed.success ? parsed.data : productListQuerySchema.parse({});
  const [result, categories, user] = await Promise.all([
    listProducts(query),
    listCategories(),
    getCurrentUser(),
  ]);
  const wishlistIds = new Set(user ? await getWishlistProductIds(user.id) : []);

  return (
    <section className="bg-stone-100 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-7 border-b border-stone-300 pb-10 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
              Phase 04 / Product system
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] text-stone-950 sm:text-6xl">
              商品目录
            </h1>
          </div>
          <div className="max-w-xl">
            <p className="text-sm leading-7 text-stone-600">
              通过关键词、分类、价格与库存组合查找商品；所有排序都使用稳定次序，分页结果可复现。
            </p>
            <p className="mt-3 text-xs font-semibold text-stone-950">
              共 {result.pagination.total} 件在售商品
            </p>
          </div>
        </div>

        <div className="mt-8">
          <CategoryNavigation categories={categories} query={query} />
        </div>

        {!parsed.success ? (
          <p className="mt-6 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
            部分查询参数无效，已恢复默认筛选条件。
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <ProductFilters categories={categories} query={query} />

          <div>
            {result.items.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    initialWishlisted={wishlistIds.has(product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid min-h-96 place-items-center rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-orange-600 uppercase">
                    No results
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
                    没有找到符合条件的商品
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
                    请尝试更换关键词或清除筛选；新项目也可以运行目录种子脚本生成演示商品。
                  </p>
                </div>
              </div>
            )}

            <ProductPagination pagination={result.pagination} query={query} />
          </div>
        </div>
      </div>
    </section>
  );
}
