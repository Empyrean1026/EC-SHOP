import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { requireUser } from "@/lib/auth/dal";
import { getAdminProduct } from "@/services/admin-service";
import { listCategories } from "@/services/product-service";

export const metadata: Metadata = { title: "商品を編集" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const [product, categories] = await Promise.all([
    getAdminProduct((await params).id),
    listCategories(),
  ]);
  if (!product) notFound();

  return (
    <section className="px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Admin / Edit product
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950">
          商品を編集
        </h1>
        <p className="mt-3 text-sm text-stone-500">
          {product.name} · {product.id}
        </p>
        <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-9">
          <ProductForm categories={categories} product={product} />
        </div>
      </div>
    </section>
  );
}
