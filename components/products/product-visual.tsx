/* eslint-disable @next/next/no-img-element */

type ProductVisualProps = {
  name: string;
  image?: string;
  priority?: boolean;
  className?: string;
};

const backgrounds = [
  "from-orange-100 via-amber-50 to-stone-200",
  "from-emerald-100 via-lime-50 to-stone-200",
  "from-sky-100 via-cyan-50 to-stone-200",
  "from-violet-100 via-fuchsia-50 to-stone-200",
];

export function ProductVisual({
  name,
  image,
  priority = false,
  className = "",
}: ProductVisualProps) {
  const background = backgrounds[name.codePointAt(0)! % backgrounds.length];

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${background} ${className}`}
      aria-label={image ? undefined : `${name} 暂无商品图片`}
      role={image ? undefined : "img"}
    >
      {image ? (
        <img
          className="size-full object-cover transition duration-500 group-hover:scale-[1.02]"
          src={image}
          alt={name}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-5xl font-semibold tracking-[-0.08em] text-stone-900/20 uppercase">
            {name.slice(0, 2)}
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/10 to-transparent" />
    </div>
  );
}
