import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { ProductVisual } from "@/components/products/product-visual";
import { formatProductPrice } from "@/lib/products/format";
import { buildHomeScenes, selectHomeProducts } from "@/lib/storefront/home";
import type { CatalogCategory, CatalogProduct } from "@/types/product";

type StorefrontHomeProps = {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  catalogStatus: "ready" | "error";
  demoMode: boolean;
};

function CatalogMessage({ status }: { status: "empty" | "error" }) {
  const error = status === "error";

  return (
    <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white px-6 py-12 text-center sm:px-10">
      <p className="text-xs font-semibold tracking-[0.16em] text-orange-600 uppercase">
        {error ? "Catalog unavailable" : "Catalog update"}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
        {error ? "商品情報を読み込めませんでした" : "商品は現在準備中です"}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-stone-500">
        {error
          ? "時間をおいてから、もう一度商品一覧を開いてください。"
          : "公開できる商品が追加されるまで、しばらくお待ちください。"}
      </p>
      <Link
        className="mt-6 inline-flex h-11 items-center rounded-full border border-stone-300 px-5 text-sm font-semibold text-stone-800 transition hover:border-stone-950"
        href="/products"
      >
        商品一覧を開く
      </Link>
    </div>
  );
}

export function StorefrontHome({
  products,
  categories,
  catalogStatus,
  demoMode,
}: StorefrontHomeProps) {
  const featuredProducts = selectHomeProducts(products);
  const scenes = buildHomeScenes(categories, products);
  const heroProduct = featuredProducts[0] ?? products.find((product) => product.stock > 0) ?? null;
  const heroCompanions = featuredProducts.slice(1, 3);

  return (
    <>
      <section className="overflow-hidden border-b border-black/10 bg-[#f5f3ee] dark:bg-[#12100f]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-16 lg:px-12 lg:py-24">
          <div className="relative z-10">
            <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
              Everyday essentials
            </p>
            <h1 className="mt-5 max-w-2xl text-5xl leading-[1.02] font-semibold tracking-[-0.055em] text-balance text-stone-950 sm:text-6xl lg:text-7xl">
              暮らしとデスクに、
              <span className="block text-orange-600">ちょうどいい。</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-stone-600 sm:text-lg">
              デスクワークからおうち時間、軽い運動まで。毎日に取り入れやすいアイテムを集めました。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                href="/products"
              >
                商品を見る
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center rounded-full border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-900 transition hover:border-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                href="#shopping-scenes"
              >
                シーンから探す
                <span className="ml-2" aria-hidden="true">
                  ↓
                </span>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
            <div className="absolute -top-16 -right-10 size-48 rounded-full bg-orange-300/45 blur-3xl dark:bg-orange-700/20" />
            {heroProduct ? (
              <div className="relative grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3 rounded-[2rem] border border-stone-200 bg-white p-3 shadow-2xl shadow-stone-900/10 sm:grid-cols-[minmax(0,1fr)_11rem] sm:gap-4 sm:p-4">
                <Link
                  className="group relative min-w-0 overflow-hidden rounded-[1.4rem] bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                  href={`/products/${heroProduct.slug}`}
                >
                  <ProductVisual
                    className="aspect-[4/3] min-h-full w-full"
                    image={heroProduct.images[0]}
                    name={heroProduct.name}
                    priority
                    sizes="(min-width: 1024px) 42vw, 72vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/85 via-stone-950/45 to-transparent px-5 pt-16 pb-5 text-white sm:px-7 sm:pb-7">
                    <p className="text-xs text-stone-200">{heroProduct.category?.name}</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                      {heroProduct.name}
                    </h2>
                    <p className="mt-2 text-sm font-semibold">
                      {formatProductPrice(heroProduct.price, heroProduct.currency)}
                    </p>
                  </div>
                </Link>

                <div className="grid min-w-0 grid-rows-2 gap-3 sm:gap-4">
                  {heroCompanions.map((product) => (
                    <Link
                      className="group flex min-h-0 flex-col overflow-hidden rounded-[1.25rem] border border-stone-200 bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                      href={`/products/${product.slug}`}
                      key={product.id}
                    >
                      <ProductVisual
                        className="h-12 w-full shrink-0 sm:h-auto sm:min-h-0 sm:flex-1"
                        image={product.images[0]}
                        name={product.name}
                        sizes="(min-width: 640px) 11rem, 7.5rem"
                      />
                      <div className="p-3 sm:p-4">
                        <p className="line-clamp-2 text-xs leading-5 font-semibold text-stone-900 sm:text-sm">
                          {product.name}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {heroCompanions.length === 0 ? (
                    <div className="row-span-2 grid place-items-center rounded-[1.25rem] bg-stone-100 p-4 text-center text-xs leading-5 text-stone-500">
                      商品一覧から、今の暮らしに合うアイテムをお探しいただけます。
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <CatalogMessage status={catalogStatus === "error" ? "error" : "empty"} />
            )}
          </div>
        </div>
      </section>

      <section
        id="shopping-scenes"
        className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
                Shop by scene
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-5xl">
                いつもの時間から探す
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-stone-500">
              使いたい場面に合わせて、現在公開中のカテゴリーから商品をご覧いただけます。
            </p>
          </div>

          {scenes.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {scenes.map((scene) => (
                <Link
                  className="group overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-50 transition hover:-translate-y-1 hover:border-stone-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                  href={scene.href}
                  key={scene.id}
                >
                  {scene.product ? (
                    <ProductVisual
                      className="aspect-[4/3] w-full"
                      image={scene.product.images[0]}
                      name={scene.product.name}
                      sizes="(min-width: 768px) 33vw, 100vw"
                    />
                  ) : (
                    <div
                      className="aspect-[4/3] bg-[radial-gradient(circle_at_28%_30%,rgba(251,146,60,0.58),transparent_34%),linear-gradient(135deg,#e7e5e4_0%,#dfe5ce_48%,#cbd5c0_100%)] dark:bg-[radial-gradient(circle_at_28%_30%,rgba(234,88,12,0.34),transparent_34%),linear-gradient(135deg,#292524_0%,#20271d_52%,#1c1917_100%)]"
                      aria-hidden="true"
                    />
                  )}
                  <div className="p-6">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-orange-600 uppercase">
                      {scene.categoryName}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-stone-950">
                      {scene.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-500">{scene.description}</p>
                    <span className="mt-5 inline-flex items-center text-xs font-semibold text-stone-800">
                      商品を見る{" "}
                      <span className="ml-2 transition group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <CatalogMessage status={catalogStatus === "error" ? "error" : "empty"} />
            </div>
          )}
        </div>
      </section>

      <section className="bg-stone-100 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
                Selected items
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-5xl">
                暮らしに取り入れたいアイテム
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-stone-700 underline-offset-4 hover:underline"
              href="/products"
            >
              すべての商品を見る →
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} showSocialProof={false} />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <CatalogMessage status={catalogStatus === "error" ? "error" : "empty"} />
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#dfe5ce] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 dark:bg-[#20271d]">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-stone-600 uppercase">
              Portfolio demo
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-5xl">
              このデモについて
            </h2>
          </div>
          <div>
            <p className="text-sm leading-7 text-stone-700">
              商品検索、商品詳細、カート、お気に入り、アカウント機能を実際の画面でご覧いただけます。
              {demoMode
                ? "公開環境では、実際の注文・決済と有料AIへのリクエストは行われません。"
                : "利用できる機能は、各画面の案内と現在の環境設定に従います。"}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center rounded-full bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-orange-600"
                href="/about"
              >
                デモの詳細を見る
              </Link>
              <Link
                className="inline-flex h-11 items-center rounded-full border border-stone-500/40 px-5 text-sm font-semibold text-stone-800 transition hover:border-stone-950"
                href="/search"
              >
                商品を検索する
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
