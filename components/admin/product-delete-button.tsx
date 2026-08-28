"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { deactivateAdminProduct } from "@/services/admin-client";

export function ProductDeleteButton({ productId }: { productId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  async function deactivate() {
    setPending(true);
    const result = await deactivateAdminProduct(productId);
    setPending(false);
    if (!result.success) {
      toast.error("商品を販売停止にできません", result.error.message);
      return;
    }
    setOpen(false);
    toast.success(
      "商品を販売停止にしました",
      "在庫を0に変更しました。過去の注文内容は変更されません。",
    );
    router.refresh();
  }

  return (
    <>
      <button
        className="text-xs font-semibold text-red-700 disabled:opacity-50"
        disabled={pending}
        onClick={() => setOpen(true)}
        type="button"
      >
        販売停止
      </button>
      <Modal
        description="販売停止後は在庫が0になり、商品一覧には表示されません。過去の注文内容は変更されません。"
        onClose={() => !pending && setOpen(false)}
        open={open}
        title="この商品の販売を停止しますか？"
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold text-stone-700"
            disabled={pending}
            onClick={() => setOpen(false)}
            type="button"
          >
            キャンセル
          </button>
          <button
            className="h-11 rounded-full bg-red-700 px-5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={pending}
            onClick={deactivate}
            type="button"
          >
            {pending ? "販売停止にしています…" : "販売を停止"}
          </button>
        </div>
      </Modal>
    </>
  );
}
