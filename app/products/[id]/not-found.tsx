import Link from "next/link";

export default function ProductNotFound() {
  return (
    <section className="grid min-h-[calc(100vh-8rem)] place-items-center bg-stone-100 px-5 py-16">
      <div className="max-w-lg text-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Product not found
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-stone-950">
          商品が見つからないか、販売を終了しています
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          この商品は販売を終了したか、商品URLが正しくない可能性があります。
        </p>
        <Link
          className="mt-7 inline-flex rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          href="/products"
        >
          商品一覧に戻る
        </Link>
      </div>
    </section>
  );
}
