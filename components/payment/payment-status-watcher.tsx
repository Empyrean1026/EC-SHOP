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
          お支払いを完了できませんでした
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          お支払いを確認できませんでした。決済画面でお支払い方法を確認し、もう一度お試しください。
        </p>
        <Link
          className="mt-7 inline-flex h-11 items-center rounded-full bg-orange-600 px-6 text-sm font-semibold text-white hover:bg-orange-700"
          href={`/checkout/payment/${orderId}`}
        >
          もう一度支払う
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
        Payment confirmation
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950">
        {timedOut ? "お支払いの確認に時間がかかっています" : "お支払い結果を確認しています"}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
        {timedOut
          ? "決済サービスからの最終確認に時間がかかっています。しばらくしてから注文詳細をご確認ください。"
          : "決済サービスでお支払い結果を確認しています。確認後、自動的に注文詳細へ移動します。"}
      </p>
      {message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          className="inline-flex h-11 items-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white hover:bg-orange-600"
          href={`/checkout/success/${orderId}`}
        >
          注文を確認
        </Link>
        {timedOut ? (
          <button
            className="inline-flex h-11 items-center rounded-full border border-stone-300 px-6 text-sm font-semibold text-stone-800"
            onClick={() => setAttempts(0)}
            type="button"
          >
            もう一度確認
          </button>
        ) : null}
      </div>
    </div>
  );
}
