"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchOrderPaymentStatus } from "@/services/payment-client";
import type { PaymentStatus } from "@/models";

const MAX_POLL_ATTEMPTS = 24;
const POLL_INTERVAL_MS = 2500;

export function PaymentStatusWatcher({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: PaymentStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "paid") {
      router.replace(`/checkout/success/${orderId}`);
      router.refresh();
      return;
    }
    if (status === "failed" || attempts >= MAX_POLL_ATTEMPTS) return;

    const timer = window.setTimeout(() => {
      void fetchOrderPaymentStatus(orderId).then((result) => {
        if (result.success) {
          setStatus(result.data.paymentStatus);
          setMessage(null);
        } else {
          setMessage(result.error.message);
        }
        setAttempts((value) => value + 1);
      });
    }, POLL_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [attempts, orderId, router, status]);

  if (status === "failed") {
    return (
      <div>
        <span
          className="grid size-12 place-items-center rounded-full bg-red-100 text-xl text-red-700"
          aria-hidden="true"
        >
          !
        </span>
        <p className="mt-6 text-xs font-semibold tracking-[0.18em] text-red-700 uppercase">
          Payment failed
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950">
          支付未完成
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          Stripe Webhook 已报告支付失败。你可以返回支付页检查支付方式后再次尝试。
        </p>
        <Link
          className="mt-7 inline-flex h-11 items-center rounded-full bg-orange-600 px-6 text-sm font-semibold text-white hover:bg-orange-700"
          href={`/checkout/payment/${orderId}`}
        >
          重新支付
        </Link>
      </div>
    );
  }

  const timedOut = attempts >= MAX_POLL_ATTEMPTS;

  return (
    <div>
      <span
        className="grid size-12 place-items-center rounded-full bg-blue-100 text-xl text-blue-700"
        aria-hidden="true"
      >
        ···
      </span>
      <p className="mt-6 text-xs font-semibold tracking-[0.18em] text-blue-700 uppercase">
        Webhook verification
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950">
        {timedOut ? "支付确认仍在处理中" : "正在确认支付结果"}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
        {timedOut
          ? "暂时没有收到最终 Webhook。订单不会因为浏览器返回而被标记为已支付，请稍后在订单页面查看。"
          : "我们正在等待 Stripe 的签名 Webhook。请保持页面打开，确认完成后会自动进入订单页面。"}
      </p>
      {message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          className="inline-flex h-11 items-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white hover:bg-orange-600"
          href={`/checkout/success/${orderId}`}
        >
          查看订单
        </Link>
        {timedOut ? (
          <button
            className="inline-flex h-11 items-center rounded-full border border-stone-300 px-6 text-sm font-semibold text-stone-800"
            onClick={() => setAttempts(0)}
            type="button"
          >
            重新检查
          </button>
        ) : null}
      </div>
    </div>
  );
}
