import Link from "next/link";

const foundations = [
  {
    index: "01",
    name: "Next.js 16",
    detail: "App RouterとReact Server Components",
  },
  {
    index: "02",
    name: "TypeScript",
    detail: "厳格な型チェックと統一されたパスエイリアス",
  },
  {
    index: "03",
    name: "MongoDB",
    detail: "Mongoose 接続の再利用とヘルスチェック",
  },
  {
    index: "04",
    name: "Tailwind CSS",
    detail: "モバイルファースト、テーマ切替、状態表示コンポーネント",
  },
  {
    index: "05",
    name: "Code Quality",
    detail: "ESLint、Prettier、型チェック",
  },
  {
    index: "06",
    name: "Docker",
    detail: "アプリとデータベースをワンコマンドで起動",
  },
];

const upcomingModules = [
  "プロモーション",
  "レビュー",
  "在庫引当",
  "返金フロー",
  "権限監査",
  "デプロイ最適化",
];

export default function Home() {
  return (
    <>
      <section className="overflow-hidden border-b border-black/10">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-20 lg:px-12 lg:py-32">
          <div>
            <div className="mb-7 flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
              <span className="h-px w-9 bg-current" aria-hidden="true" />
              Phase 13 / UI &amp; UX
            </div>
            <h1 className="max-w-3xl text-5xl leading-[0.96] font-semibold tracking-[-0.055em] text-balance text-stone-950 sm:text-6xl lg:text-7xl">
              モダンなECサイトを、
              <span className="block text-orange-600">堅牢な基盤から。</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
              モバイルからデスクトップまで一貫したショッピング体験を提供。テーマ切替、わかりやすいフィードバック、アクセシブルな操作で、
              購入までの流れを快適にします。
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                href="#foundation"
              >
                技術構成を見る
                <span className="ml-2" aria-hidden="true">
                  ↓
                </span>
              </a>
              <Link
                className="inline-flex h-12 items-center justify-center rounded-full border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-900 transition hover:border-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                href="/products"
              >
                商品を見る
              </Link>
            </div>
          </div>

          <div
            className="relative min-h-[430px] rounded-[2rem] bg-stone-950 p-5 shadow-2xl shadow-stone-900/15 sm:p-7"
            aria-label="ECサイト画面のプレビュー"
          >
            <div className="absolute -top-12 -right-16 -z-10 h-52 w-52 rounded-full bg-orange-300/70 blur-3xl" />
            <div className="flex items-center justify-between border-b border-white/10 pb-5 text-white">
              <span className="text-sm font-semibold tracking-[0.22em]">NEW / EDIT</span>
              <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-widest text-stone-300">
                PREVIEW
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="col-span-2 h-40 rounded-3xl bg-[linear-gradient(125deg,#f2c9a3_0%,#d66434_45%,#702f1d_100%)] p-5">
                <p className="text-xs font-semibold tracking-widest text-stone-950/60 uppercase">
                  Seasonal selection
                </p>
                <p className="mt-12 max-w-48 text-2xl leading-6 font-semibold tracking-tight text-white">
                  Less noise. Better objects.
                </p>
              </div>
              <div className="rounded-3xl bg-stone-100 p-4">
                <div className="h-24 rounded-2xl bg-[radial-gradient(circle_at_60%_30%,#fff_0%,#d7d2c7_50%,#a49e91_100%)]" />
                <p className="mt-3 text-xs font-semibold text-stone-900">Form Chair</p>
                <p className="mt-1 text-xs text-stone-500">¥ 48,000</p>
              </div>
              <div className="rounded-3xl bg-[#d8dfc4] p-4 dark:bg-[#566041]">
                <div className="h-24 rounded-2xl bg-[radial-gradient(circle_at_35%_25%,#eef3df_0%,#a3ad82_50%,#566041_100%)]" />
                <p className="mt-3 text-xs font-semibold text-stone-900">Stone Lamp</p>
                <p className="mt-1 text-xs text-stone-600">¥ 21,500</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="foundation" className="scroll-mt-24 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
                Ready to build
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-stone-950 sm:text-4xl">
                6つの技術基盤で、
                <br />
                一貫した開発体験を。
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-stone-600">
                ローカル開発から Docker
                環境まで、ディレクトリ構成、データ接続、品質チェックを明確化し、今後の機能追加にも対応できる基盤を整えています。
              </p>
            </div>
            <div className="grid border-t border-l border-stone-200 sm:grid-cols-2">
              {foundations.map((item) => (
                <article className="border-r border-b border-stone-200 p-6 sm:p-7" key={item.name}>
                  <span className="font-mono text-xs text-stone-400">{item.index}</span>
                  <h3 className="mt-8 text-lg font-semibold tracking-tight text-stone-950">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-500">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="scroll-mt-24 bg-[#dfe5ce] dark:bg-[#20271d]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-stone-600 uppercase">
                Architecture
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-5xl">
                単一リポジトリで、フルスタックの構成を明快に。
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-stone-700">
              App Router が画面とサーバー側の Route Handlers を担い、Mongoose で MongoDB
              接続を一元管理。初期段階での不要なサービス分割を避けています。
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-stone-950/15 sm:grid-cols-4">
            {["Browser", "App Router", "Route Handlers", "MongoDB"].map((step, index) => (
              <div className="relative bg-[#eef1e4] p-6 sm:min-h-36 dark:bg-stone-900" key={step}>
                <span className="text-[10px] font-semibold tracking-widest text-stone-500">
                  0{index + 1}
                </span>
                <p className="mt-10 text-lg font-semibold text-stone-950">{step}</p>
                {index < 3 ? (
                  <span className="absolute right-5 bottom-5 text-stone-400" aria-hidden="true">
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="next" className="scroll-mt-24 bg-stone-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-orange-400 uppercase">
                Coming next
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                基盤を整え、
                <br />
                機能を段階的に拡張。
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-px border-t border-l border-white/15 bg-white/15">
              {upcomingModules.map((module, index) => (
                <div
                  className="border-r border-b border-white/15 bg-stone-950 p-5 sm:p-6"
                  key={module}
                >
                  <span className="text-[10px] text-stone-600">0{index + 1}</span>
                  <p className="mt-6 text-sm font-medium text-stone-200">{module}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
