"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { updateAdminStock } from "@/services/admin-client";

export function InventoryEditor({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const value = String(new FormData(event.currentTarget).get("stock") ?? "").trim();
    const nextStock = value === "" ? Number.NaN : Number(value);
    const result = await updateAdminStock(productId, nextStock);
    if (!result.success) {
      setError(result.error.message);
      toast.error("在庫を更新できません", result.error.message);
      setPending(false);
      return;
    }
    setPending(false);
    toast.success("在庫を更新しました", `現在の在庫は${nextStock} 点。`);
    router.refresh();
  }

  return (
    <form className="flex items-center gap-2" onSubmit={handleSubmit}>
      <input
        className="h-9 w-20 rounded-lg border border-stone-300 px-2 text-sm"
        name="stock"
        type="number"
        min="0"
        step="1"
        defaultValue={stock}
        aria-label="在庫数"
      />
      <button
        className="h-9 rounded-full bg-stone-950 px-3 text-xs font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        保存
      </button>
      {error ? (
        <span className="text-xs text-red-700" role="alert">
          {error}
        </span>
      ) : null}
    </form>
  );
}
