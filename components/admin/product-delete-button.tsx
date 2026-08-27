"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deactivateAdminProduct } from "@/services/admin-client";

export function ProductDeleteButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function deactivate() {
    if (!window.confirm("确定下架该商品吗？库存会同时设为 0，历史订单不会受影响。")) return;
    setPending(true);
    const result = await deactivateAdminProduct(productId);
    setPending(false);
    if (!result.success) return window.alert(result.error.message);
    router.refresh();
  }

  return (
    <button
      className="text-xs font-semibold text-red-700 disabled:opacity-50"
      disabled={pending}
      onClick={deactivate}
      type="button"
    >
      {pending ? "处理中…" : "下架"}
    </button>
  );
}
