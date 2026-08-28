"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  createAdminProduct,
  updateAdminProduct,
  type AdminClientError,
} from "@/services/admin-client";
import type { CatalogCategory, CatalogProduct } from "@/types/product";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none focus:border-stone-950";
const labelClass = "text-xs font-semibold text-stone-700";

export function ProductForm({
  categories,
  product,
}: {
  categories: CatalogCategory[];
  product?: CatalogProduct;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AdminClientError | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const numberInput = (name: string) => {
      const value = String(data.get(name) ?? "").trim();
      return value === "" ? null : Number(value);
    };
    const input = {
      name: String(data.get("name") ?? ""),
      slug: String(data.get("slug") ?? ""),
      description: String(data.get("description") ?? ""),
      price: numberInput("price"),
      currency: String(data.get("currency")),
      categoryId: String(data.get("categoryId") ?? ""),
      images: String(data.get("images") ?? "")
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean),
      stock: numberInput("stock"),
      isActive: data.get("isActive") === "on",
    };
    const result = product
      ? await updateAdminProduct(product.id, input)
      : await createAdminProduct(input);

    if (!result.success) {
      setError(result.error);
      toast.error("商品を保存できません", result.error.message);
      setPending(false);
      return;
    }
    toast.success(product ? "商品を更新しました" : "商品を登録しました", "商品一覧に戻ります。");
    router.push("/admin/products");
    router.refresh();
  }

  const fieldError = (name: string) => error?.details?.[name]?.join("；");

  return (
    <form className="space-y-6" method="post" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          商品名
          <input className={inputClass} name="name" defaultValue={product?.name} required />
          {fieldError("name") ? (
            <span className="mt-1 block text-red-700">{fieldError("name")}</span>
          ) : null}
        </label>
        <label className={labelClass}>
          Slug
          <input
            className={inputClass}
            name="slug"
            defaultValue={product?.slug}
            placeholder="stone-table-lamp"
            required
          />
          {fieldError("slug") ? (
            <span className="mt-1 block text-red-700">{fieldError("slug")}</span>
          ) : null}
        </label>
      </div>
      <label className={labelClass}>
        商品説明
        <textarea
          className="mt-2 min-h-36 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-950 outline-none focus:border-stone-950"
          name="description"
          defaultValue={product?.description}
          required
        />
        {fieldError("description") ? (
          <span className="mt-1 block text-red-700">{fieldError("description")}</span>
        ) : null}
      </label>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className={labelClass}>
          価格（最小通貨単位）
          <input
            className={inputClass}
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.price ?? 0}
            required
          />
        </label>
        <label className={labelClass}>
          通貨
          <select className={inputClass} name="currency" defaultValue={product?.currency ?? "jpy"}>
            <option value="jpy">JPY</option>
            <option value="usd">USD</option>
            <option value="cny">CNY</option>
          </select>
        </label>
        <label className={labelClass}>
          カテゴリー
          <select
            className={inputClass}
            name="categoryId"
            defaultValue={product?.category?.id ?? ""}
            required
          >
            <option value="">カテゴリーを選択</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldError("categoryId") ? (
            <span className="mt-1 block text-red-700">{fieldError("categoryId")}</span>
          ) : null}
        </label>
        <label className={labelClass}>
          在庫
          <input
            className={inputClass}
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stock ?? 0}
            required
          />
        </label>
      </div>
      <label className={labelClass}>
        画像URL（HTTP(S) または /public 配下のパス、改行またはカンマ区切り）
        <textarea
          className="mt-2 min-h-24 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-950"
          name="images"
          defaultValue={product?.images.join("\n")}
        />
        {fieldError("images") ? (
          <span className="mt-1 block text-red-700">{fieldError("images")}</span>
        ) : null}
      </label>
      <label className="flex items-center gap-3 text-sm font-semibold text-stone-800">
        <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} /> 販売中
      </label>
      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error.message}
        </p>
      ) : null}
      <button
        className="h-12 rounded-full bg-stone-950 px-7 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "保存しています…" : product ? "商品を保存" : "商品を登録"}
      </button>
    </form>
  );
}
