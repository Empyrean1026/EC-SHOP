"use client";

export default function ProductsError({ reset }: { reset: () => void }) {
  return (
    <section className="grid min-h-[calc(100vh-8rem)] place-items-center bg-stone-100 px-5 py-16">
      <div className="max-w-lg text-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Catalog unavailable
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-stone-950">
          商品を読み込めません
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          一時的に商品情報を取得できません。時間をおいて、もう一度お試しください。
        </p>
        <button
          className="mt-7 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          type="button"
          onClick={reset}
        >
          再読み込み
        </button>
      </div>
    </section>
  );
}
