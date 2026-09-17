import type { Metadata } from "next";
import Link from "next/link";
import { isShopDemo } from "@/lib/demo";

export const metadata: Metadata = {
  title: "このデモについて",
  description: "EC Siteで体験できる機能と、公開デモ環境の制限をご案内します。",
};

const features = [
  "商品一覧、カテゴリー、価格、在庫による絞り込み",
  "キーワード検索と商品詳細の確認",
  "ゲストおよびログイン後のカート操作",
  "アカウント、注文履歴、お届け先、お気に入り画面",
  "レスポンシブ表示とライト・ダークテーマ",
];

export default function AboutPage() {
  const demoMode = isShopDemo();

  return (
    <section className="bg-stone-100 px-5 py-12 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-7 sm:p-10 lg:p-14">
          <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
            Portfolio demo
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-stone-950 sm:text-6xl">
            このデモについて
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-stone-600">
            EC
            Siteは、商品を探してカートへ追加し、アカウント機能まで確認できる個人ポートフォリオ用のECアプリケーションです。
          </p>

          <div className="mt-10 grid gap-8 border-t border-stone-200 pt-10 lg:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold text-stone-950">体験できること</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-stone-600">
                {features.map((feature) => (
                  <li className="flex gap-3" key={feature}>
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-[#dfe5ce] p-6 sm:p-8 dark:bg-[#20271d]">
              <h2 className="text-xl font-semibold text-stone-950">公開環境での制限</h2>
              <p className="mt-4 text-sm leading-7 text-stone-700">
                {demoMode
                  ? "この公開環境では、実際の注文作成・決済・有料AIへのリクエストは無効です。登録やカートを試す場合は、架空の情報をご使用ください。"
                  : "利用できる操作は現在の環境設定に従います。注文や決済を行う前に、各画面の案内をご確認ください。"}
              </p>
              <p className="mt-4 text-sm leading-7 text-stone-700">
                商品の閲覧、検索、カート、お気に入りなど、外部の有料サービスを使用しない範囲を中心にご覧いただけます。
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center rounded-full bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-orange-600"
              href="/products"
            >
              商品を見る
            </Link>
            <a
              className="inline-flex h-11 items-center rounded-full border border-stone-300 px-5 text-sm font-semibold text-stone-800 transition hover:border-stone-950"
              href="https://github.com/Empyrean1026/EC-SHOP"
              rel="noreferrer"
              target="_blank"
            >
              GitHubで技術情報を見る
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
