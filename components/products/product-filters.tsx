import Link from "next/link";
import { buildProductsUrl } from "@/lib/products/url";
import type { ProductListQuery } from "@/lib/validations/product";
import type { CatalogCategory } from "@/types/product";

type ProductFiltersProps = {
  categories: CatalogCategory[];
  query: ProductListQuery;
};

const inputClassName =
  "h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10";

export function ProductFilters({ categories, query }: ProductFiltersProps) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      <form
        action="/products"
        className="rounded-3xl border border-stone-200 bg-white p-5"
        method="get"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-950">商品を絞り込む</h2>
          <Link
            className="text-xs text-stone-500 underline-offset-4 hover:underline"
            href="/products"
          >
            クリア
          </Link>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-stone-700">
            キーワード
            <input
              className={`${inputClassName} mt-2`}
              defaultValue={query.q}
              name="q"
              placeholder="商品名・説明を検索"
              type="search"
            />
          </label>

          <label className="block text-xs font-semibold text-stone-700">
            カテゴリー
            <select
              className={`${inputClassName} mt-2`}
              defaultValue={query.category ?? ""}
              name="category"
            >
              <option value="">すべてのカテゴリー</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name} ({category.productCount})
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-stone-700">
              最低価格
              <input
                className={`${inputClassName} mt-2`}
                defaultValue={query.minPrice}
                min="0"
                name="minPrice"
                placeholder="0"
                type="number"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-700">
              最高価格
              <input
                className={`${inputClassName} mt-2`}
                defaultValue={query.maxPrice}
                min="0"
                name="maxPrice"
                placeholder="指定なし"
                type="number"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-stone-700">
            並び順
            <select className={`${inputClassName} mt-2`} defaultValue={query.sort} name="sort">
              <option value="newest">新着順</option>
              <option value="price_asc">価格の安い順</option>
              <option value="price_desc">価格の高い順</option>
              <option value="sales_desc">売れ筋順</option>
              <option value="rating_desc">評価の高い順</option>
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-xl bg-stone-100 px-3 py-3 text-xs font-semibold text-stone-700">
            <input
              className="size-4 accent-stone-950"
              defaultChecked={query.inStock === true}
              name="inStock"
              type="checkbox"
              value="true"
            />
            在庫あり商品のみ表示
          </label>
        </div>

        <button
          className="mt-5 h-11 w-full rounded-full bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-orange-600"
          type="submit"
        >
          絞り込む
        </button>
      </form>

      <div className="hidden rounded-3xl bg-[#dfe5ce] p-5 lg:block dark:bg-[#20271d]">
        <p className="text-xs font-semibold tracking-[0.15em] text-stone-600 uppercase">
          Catalog API
        </p>
        <p className="mt-8 text-sm leading-6 text-stone-800">
          一覧はサーバーからMongoDBを直接参照し、公開REST APIと同じ検索条件を使用しています。
        </p>
      </div>
    </aside>
  );
}

export function CategoryNavigation({ categories, query }: ProductFiltersProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="カテゴリー">
      <Link
        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
          !query.category
            ? "bg-stone-950 text-white"
            : "border border-stone-300 bg-white text-stone-600 hover:border-stone-950"
        }`}
        href={buildProductsUrl(query, { category: null, page: 1 })}
      >
        すべての商品
      </Link>
      {categories.map((category) => {
        const selected = query.category === category.slug;

        return (
          <Link
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              selected
                ? "bg-stone-950 text-white"
                : "border border-stone-300 bg-white text-stone-600 hover:border-stone-950"
            }`}
            href={buildProductsUrl(query, { category: category.slug, page: 1 })}
            key={category.id}
          >
            {category.name} · {category.productCount}
          </Link>
        );
      })}
    </nav>
  );
}
