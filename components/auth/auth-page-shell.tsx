import Link from "next/link";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  alternateText: string;
  alternateHref: string;
  alternateLabel: string;
};

export function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
  alternateText,
  alternateHref,
  alternateLabel,
}: AuthPageShellProps) {
  return (
    <section className="min-h-[calc(100vh-8rem)] bg-stone-100 px-5 py-12 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-xl shadow-stone-900/5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-stone-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -top-20 -right-20 size-64 rounded-full bg-orange-500/30 blur-3xl" />
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-orange-400 uppercase">
              Your everyday store
            </p>
            <p className="mt-8 max-w-sm text-4xl leading-tight font-semibold tracking-[-0.04em]">
              お気に入りや注文履歴を、ひとつのアカウントで見やすく管理できます。
            </p>
          </div>
          <div className="grid gap-3 text-xs text-stone-400">
            <p>お気に入りをいつでも確認</p>
            <p>お届け先をまとめて管理</p>
            <p>注文状況をひと目で確認</p>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-12">
          <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-stone-950">{title}</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-stone-600">{description}</p>

          <div className="mt-9">{children}</div>

          <p className="mt-8 text-center text-sm text-stone-500">
            {alternateText}{" "}
            <Link
              className="font-semibold text-stone-950 underline-offset-4 hover:underline"
              href={alternateHref}
            >
              {alternateLabel}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
