"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPaymentIntentSession } from "@/services/payment-client";
import type { CheckoutOrder } from "@/types/checkout";
import type { PaymentIntentSession } from "@/types/payment";

function StripeConfirmationForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setMessage(null);
    const returnUrl = `${window.location.origin}/checkout/payment/return?orderId=${encodeURIComponent(orderId)}`;
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (result.error) {
      setMessage(
        result.error.message ??
          "お支払いを完了できませんでした。入力内容を確認して、もう一度お試しください。",
      );
      setSubmitting(false);
      return;
    }

    router.replace(`/checkout/payment/return?orderId=${encodeURIComponent(orderId)}`);
  }

  return (
    <form method="post" onSubmit={submit}>
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {message ? (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {message}
        </p>
      ) : null}
      <button
        className="mt-6 h-12 w-full rounded-full bg-orange-600 px-6 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!stripe || !elements || submitting}
        type="submit"
      >
        {submitting ? "お支払いを処理しています…" : "お支払いを確定する"}
      </button>
      <p className="mt-3 text-center text-xs leading-5 text-stone-500">
        カード情報はStripeの安全な決済画面で入力され、当サイトには保存されません。
      </p>
    </form>
  );
}

export function StripePaymentPanel({
  order,
  publishableKey,
}: {
  order: CheckoutOrder;
  publishableKey: string | null;
}) {
  const router = useRouter();
  const [session, setSession] = useState<PaymentIntentSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(publishableKey));
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  useEffect(() => {
    if (!publishableKey) return;
    let active = true;

    void createPaymentIntentSession(order.id).then((result) => {
      if (!active) return;
      if (!result.success) {
        setError(result.error.message);
        setLoading(false);
        return;
      }
      if (result.data.paymentStatus === "paid") {
        router.replace(`/checkout/success/${order.id}`);
        return;
      }
      setSession(result.data);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [order.id, publishableKey, router]);

  if (!publishableKey) {
    return (
      <div className="rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-900" role="alert">
        現在、カード決済をご利用いただけません。時間をおいて、もう一度お試しください。
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid min-h-48 place-items-center text-sm text-stone-500" role="status">
        安全な決済セッションを作成しています…
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-800" role="alert">
          {error}
        </p>
        <button
          className="mt-4 text-sm font-semibold text-stone-950 underline"
          onClick={() => window.location.reload()}
          type="button"
        >
          決済サービスに再接続
        </button>
      </div>
    );
  }

  if (!session?.clientSecret || !stripePromise) {
    return (
      <div className="rounded-2xl bg-blue-50 p-5 text-sm leading-6 text-blue-900">
        <p>お支払いを受け付けました。決済サービスからの最終確認を待っています。</p>
        <Link
          className="mt-3 inline-block font-semibold underline"
          href={`/checkout/payment/return?orderId=${order.id}`}
        >
          お支払い状況を確認
        </Link>
      </div>
    );
  }

  return (
    <Elements
      options={{
        clientSecret: session.clientSecret,
        locale: "ja",
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#ea580c",
            colorText: "#1c1917",
            borderRadius: "12px",
            fontFamily: "system-ui, sans-serif",
          },
        },
      }}
      stripe={stripePromise}
    >
      <StripeConfirmationForm orderId={order.id} />
    </Elements>
  );
}
