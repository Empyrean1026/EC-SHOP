"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import type { OrderStatus } from "@/models";
import { updateOrderStatus } from "@/services/admin-client";

export function OrderStatusForm({ orderId, allowed }: { orderId: string; allowed: OrderStatus[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (allowed.length === 0)
    return <p className="text-sm text-stone-500">当前订单没有可执行的下一状态。</p>;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const status = String(new FormData(event.currentTarget).get("orderStatus")) as OrderStatus;
    const result = await updateOrderStatus(orderId, status);
    if (!result.success) {
      setError(result.error.message);
      toast.error("订单状态更新失败", result.error.message);
      setPending(false);
      return;
    }
    setPending(false);
    toast.success("订单状态已更新", `订单已进入“${ORDER_STATUS_LABELS[status]}”。`);
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
      <select
        className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
        name="orderStatus"
      >
        {allowed.map((status) => (
          <option key={status} value={status}>
            {ORDER_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      <button
        className="h-11 rounded-full bg-stone-950 px-5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "正在更新…" : "更新订单状态"}
      </button>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
