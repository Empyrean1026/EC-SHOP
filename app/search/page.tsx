import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { SearchBox } from "@/components/search/search-box";
import { SearchPagination } from "@/components/search/search-pagination";
import { buildSearchUrl } from "@/lib/search/url";
import { searchQuerySchema } from "@/lib/validations/search";
import { listCategories } from "@/services/product-service";
import { searchProducts } from "@/services/search-service";
import type { SearchMode } from "@/types/search";

export const metadata: Metadata = {
  title: "商品検索",
  description: "EC Siteの商品名や説明文から検索できます。",
};

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const modeLabels: Record<SearchMode, string> = {
  full_text: "全文検索",
  substring: "部分一致",
  fuzzy: "あいまい検索",
  none: "該当なし",
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawSearchParams = firstSearchParamValues(await searchParams);
  const parsed = searchQuerySchema.safeParse(rawSearchParams);
  const query = parsed.success ? parsed.data : searchQuerySchema.parse({});
  const [result, categories] = await Promise.all([searchProducts(query), listCategories()]);
  const hasQuery = Boolean(query.q);

  return (
    <section className="min-h-[75vh] bg-stone-100 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-stone-300 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
              Phase 05 / Product search
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] text-stone-950 sm:text-6xl">
              お探しの商品を見つける
            </h1>
          </div>
          <SearchBox key={query.q ?? "empty"} initialValue={query.q} prominent />
        </div>

        {!parsed.success ? (
          <p className="mt-6 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
            検索条件が正しくありません。キーワードは2〜100文字で入力してください。既定の状態に戻しました。
          </p>
        ) : null}

        {hasQuery ? (
          <>
            <div className="mt-8 flex flex-col gap-5 rounded-3xl border border-stone-200 bg-white p-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs text-stone-500">「{query.q}」の検索結果</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                  {result.pagination.total}点の商品
                </p>
                <p className="mt-1 text-[11px] text-stone-400">
                  検索方法：{modeLabels[result.mode]}
                  {result.mode === "fuzzy" ? "（表記ゆれを補正）" : ""}
                </p>
              </div>

              <form action="/search" className="grid gap-3 sm:grid-cols-3" method="get">
                <input name="q" type="hidden" value={query.q} />
                {query.fuzzy ? null : <input name="fuzzy" type="hidden" value="false" />}
                <label className="text-xs font-semibold text-stone-600">
                  カテゴリー
                  <select
                    className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none focus:border-stone-950"
                    defaultValue={query.category ?? ""}
                    name="category"
                  >
                    <option value="">すべてのカテゴリー</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-stone-600">
                  並び順
                  <select
                    className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none focus:border-stone-950"
                    defaultValue={query.sort}
                    name="sort"
                  >
                    <option value="relevance">関連度順</option>
                    <option value="newest">新着順</option>
                    <option value="price_asc">価格の安い順</option>
                    <option value="price_desc">価格の高い順</option>
                    <option value="sales_desc">売れ筋順</option>
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    className="h-10 w-full rounded-full bg-stone-950 px-5 text-xs font-semibold text-white transition hover:bg-orange-600"
                    type="submit"
                  >
                    検索条件を更新
                  </button>
                </div>
                <label className="col-span-full flex items-center gap-2 text-xs text-stone-500">
                  <input
                    className="size-4 accent-stone-950"
                    defaultChecked={query.inStock === true}
                    name="inStock"
                    type="checkbox"
                    value="true"
                  />
                  在庫あり商品のみ表示
                </label>
              </form>
            </div>

            {result.items.length > 0 ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="mt-8 grid min-h-96 place-items-center rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-orange-600 uppercase">
                    No results
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
                    「{query.q}」に一致する商品はありません
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
                    短いキーワードや別の表記を試すか、カテゴリーと在庫の絞り込みを解除してください。
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <Link
                      className="rounded-full bg-stone-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-orange-600"
                      href={buildSearchUrl(query, { category: null, inStock: null, page: 1 })}
                    >
                      絞り込みを解除
                    </Link>
                    <Link
                      className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:border-stone-950"
                      href="/products"
                    >
                      すべての商品を見る
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <SearchPagination pagination={result.pagination} query={query} />
          </>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl bg-stone-950 p-7 text-white md:col-span-2">
              <p className="text-xs font-semibold tracking-[0.16em] text-orange-400 uppercase">
                Search tips
              </p>
              <h2 className="mt-16 max-w-xl text-3xl font-semibold tracking-[-0.04em]">
                2文字以上入力すると、候補と表記ゆれを考慮した検索結果を表示します。
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-stone-400">
                検索履歴はこのブラウザ内にのみ保存され、サーバーには送信されません。
              </p>
            </div>
            <div className="rounded-3xl bg-[#dfe5ce] p-7 dark:bg-[#20271d]">
              <p className="text-xs font-semibold tracking-[0.16em] text-stone-600 uppercase">
                Try these
              </p>
              <div className="mt-10 flex flex-wrap gap-2">
                {["デスクライト", "ヘッドホン", "キーボード", "ノート"].map((term) => (
                  <Link
                    className="rounded-full border border-stone-500/30 bg-white/60 px-4 py-2 text-xs font-semibold text-stone-800 transition hover:bg-white"
                    href={`/search?q=${encodeURIComponent(term)}`}
                    key={term}
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
