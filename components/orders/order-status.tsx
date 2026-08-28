import {
  ORDER_PROGRESS_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/orders/status";
import type { OrderStatus, PaymentStatus } from "@/models";

const orderBadgeStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  paid: "bg-blue-100 text-blue-900",
  processing: "bg-violet-100 text-violet-900",
  shipped: "bg-cyan-100 text-cyan-900",
  completed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-stone-200 text-stone-700",
};

const paymentBadgeStyles: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  processing: "bg-blue-100 text-blue-900",
  paid: "bg-emerald-100 text-emerald-900",
  failed: "bg-red-100 text-red-900",
  partially_refunded: "bg-violet-100 text-violet-900",
  refunded: "bg-stone-200 text-stone-700",
};

const badgeBase = "inline-flex rounded-full px-3 py-1 text-xs font-semibold";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`${badgeBase} ${orderBadgeStyles[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`${badgeBase} ${paymentBadgeStyles[status]}`}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-2xl bg-stone-100 p-5">
        <p className="text-sm font-semibold text-stone-800">注文はキャンセルされました</p>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          この注文の配送手続きは行われません。
        </p>
      </div>
    );
  }

  const currentIndex = ORDER_PROGRESS_STATUSES.indexOf(status);

  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="注文の配送状況">
      {ORDER_PROGRESS_STATUSES.map((step, index) => {
        const active = index <= currentIndex;
        const current = index === currentIndex;
        return (
          <li className="min-w-0" key={step}>
            <div className={`h-1.5 rounded-full ${active ? "bg-orange-600" : "bg-stone-200"}`} />
            <p
              aria-current={current ? "step" : undefined}
              className={`mt-2 truncate text-[10px] font-semibold sm:text-xs ${
                active ? "text-stone-950" : "text-stone-400"
              }`}
            >
              {ORDER_STATUS_LABELS[step]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
