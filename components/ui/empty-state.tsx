import Link from "next/link";

type EmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: string;
};

export function EmptyState({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  icon = "○",
}: EmptyStateProps) {
  return (
    <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <div>
        <span
          className="mx-auto grid size-14 place-items-center rounded-full bg-stone-100 text-xl text-stone-600"
          aria-hidden="true"
        >
          {icon}
        </span>
        <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-orange-600 uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">{title}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">{description}</p>
        {actionHref && actionLabel ? (
          <Link
            className="mt-7 inline-flex h-11 items-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-orange-600"
            href={actionHref}
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
