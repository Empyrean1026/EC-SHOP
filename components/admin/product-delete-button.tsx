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
      toast.error("商品下架失败", result.error.message);
      return;
    }
    setOpen(false);
    toast.success("商品已下架", "库存已设为 0，历史订单保持不变。");
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
        下架
      </button>
      <Modal
        description="下架后库存会设为 0，商品不会出现在公开目录中；历史订单快照不会改变。"
        onClose={() => !pending && setOpen(false)}
        open={open}
        title="确定下架该商品？"
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold text-stone-700"
            disabled={pending}
            onClick={() => setOpen(false)}
            type="button"
          >
            取消
          </button>
          <button
            className="h-11 rounded-full bg-red-700 px-5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={pending}
            onClick={deactivate}
            type="button"
          >
            {pending ? "正在下架…" : "确认下架"}
          </button>
        </div>
      </Modal>
    </>
  );
}
