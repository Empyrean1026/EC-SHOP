"use client";

export default function SearchError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="grid min-h-[65vh] place-items-center bg-stone-100 px-5 text-center">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-red-600 uppercase">
          Search unavailable
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-stone-950">
          検索を実行できません
        </h1>
        <p className="mt-3 text-sm text-stone-500">
          一時的に検索を利用できません。時間をおいて、もう一度お試しください。
        </p>
        <button
          className="mt-6 rounded-full bg-stone-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-orange-600"
          onClick={reset}
          type="button"
        >
          再読み込み
        </button>
      </div>
    </section>
  );
}
