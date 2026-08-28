import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { requireUser } from "@/lib/auth/dal";
import { listCategories } from "@/services/product-service";

export const metadata: Metadata = { title: "商品を登録" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireUser("admin");
  const categories = await listCategories();
  return (
    <section className="px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Admin / New product
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950">
          商品を登録
        </h1>
        <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-9">
          <ProductForm categories={categories} />
        </div>
      </div>
    </section>
  );
}
