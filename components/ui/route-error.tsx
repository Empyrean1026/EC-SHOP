"use client";

import { useEffect } from "react";
import Link from "next/link";

export function RouteError({
  error,
  retry,
  scope = "ページ",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  scope?: string;
}) {
  useEffect(() => {
    console.error(`[ui/error] ${scope}`, error);
  }, [error, scope]);

  return (
    <section className="grid min-h-[65vh] place-items-center px-5 py-16 sm:px-8">
      <div className="w-full max-w-xl rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <span
          className="mx-auto grid size-14 place-items-center rounded-full bg-red-50 text-xl font-semibold text-red-700"
          aria-hidden="true"
        >
          !
        </span>
        <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-red-700 uppercase">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          {scope}を読み込めません
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          ネットワークまたはサービスが一時的に利用できない可能性があります。再度お試しください。エラーの詳細は画面には表示されません。
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-stone-400">エラーID：{error.digest}</p>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            className="h-11 rounded-full bg-stone-950 px-6 text-sm font-semibold text-white hover:bg-orange-600"
            onClick={retry}
            type="button"
          >
            再読み込み
          </button>
          <Link
            className="grid h-11 place-items-center rounded-full border border-stone-300 px-6 text-sm font-semibold text-stone-700"
            href="/"
          >
            トップページへ戻る
          </Link>
        </div>
      </div>
    </section>
  );
}
