import Link from "next/link";

export default function ProductNotFound() {
  return (
    <section className="grid min-h-[calc(100vh-8rem)] place-items-center bg-stone-100 px-5 py-16">
      <div className="max-w-lg text-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Product not found
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-stone-950">
          商品不存在或已下架
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          该商品可能已经停止销售，也可能使用了无效的商品地址。
        </p>
        <Link
          className="mt-7 inline-flex rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          href="/products"
        >
          返回商品目录
        </Link>
      </div>
    </section>
  );
}
