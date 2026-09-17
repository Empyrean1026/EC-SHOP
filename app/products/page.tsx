import type { Metadata } from "next";
import { CategoryNavigation, ProductFilters } from "@/components/products/product-filters";
import { ProductCard } from "@/components/products/product-card";
import { ProductPagination } from "@/components/products/product-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { productListQuerySchema } from "@/lib/validations/product";
import { getCurrentUser } from "@/lib/auth/dal";
import { listCategories, listProducts } from "@/services/product-service";
import { getWishlistProductIds } from "@/services/wishlist-service";

export const metadata: Metadata = {
  title: "商品一覧",
  description: "EC Siteの商品を閲覧・検索・絞り込みできます。",
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
              Everyday essentials
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] text-stone-950 sm:text-6xl">
              商品一覧
            </h1>
          </div>
          <div className="max-w-xl">
            <p className="text-sm leading-7 text-stone-600">
              キーワード、カテゴリー、価格、在庫状況を組み合わせて、暮らしに合う商品を探せます。
            </p>
            <p className="mt-3 text-xs font-semibold text-stone-950">
              全 {result.pagination.total} 点の商品
            </p>
          </div>
        </div>

        <div className="mt-8">
          <CategoryNavigation categories={categories} query={query} />
        </div>

        {!parsed.success ? (
          <p className="mt-6 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
            一部の検索条件が正しくないため、既定の絞り込みに戻しました。
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
              <EmptyState
                description="キーワードを変更するか、絞り込み条件を解除してもう一度お試しください。"
                eyebrow="No results"
                icon="⌕"
                title="条件に一致する商品はありません"
              />
            )}

            <ProductPagination pagination={result.pagination} query={query} />
          </div>
        </div>
      </div>
    </section>
  );
}
