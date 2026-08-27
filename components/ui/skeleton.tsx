type SkeletonProps = { className?: string };

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton rounded-2xl ${className}`} />;
}

export function PageSkeleton({ variant = "grid" }: { variant?: "grid" | "dashboard" | "form" }) {
  return (
    <div
      className="mx-auto w-full max-w-7xl"
      aria-busy="true"
      aria-label="页面正在加载"
      role="status"
    >
      <span className="sr-only">页面正在加载…</span>
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-5 h-12 w-64 max-w-[80%]" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full" />
      {variant === "dashboard" ? (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton className="h-36" key={index} />
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </>
      ) : variant === "form" ? (
        <div className="mt-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-[32rem]" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="rounded-3xl border border-stone-200 bg-white p-4" key={index}>
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="mt-5 h-5 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <Skeleton className="mt-6 h-10 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
