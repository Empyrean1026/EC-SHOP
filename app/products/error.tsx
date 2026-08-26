"use client";

export default function ProductsError({ reset }: { reset: () => void }) {
  return (
    <section className="grid min-h-[calc(100vh-8rem)] place-items-center bg-stone-100 px-5 py-16">
      <div className="max-w-lg text-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Catalog unavailable
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-stone-950">
          暂时无法加载商品
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          请确认 MongoDB 已启动并稍后重试。错误详情不会暴露给浏览器。
        </p>
        <button
          className="mt-7 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          type="button"
          onClick={reset}
        >
          重新加载
        </button>
      </div>
    </section>
  );
}
