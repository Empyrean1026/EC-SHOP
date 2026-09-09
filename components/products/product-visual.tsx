import { ProductImageWithFallback } from "@/components/products/product-image-with-fallback";

type ProductVisualProps = {
  name: string;
  image?: string;
  priority?: boolean;
  sizes?: string;
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
  sizes = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw",
  className = "",
}: ProductVisualProps) {
  const background = backgrounds[name.codePointAt(0)! % backgrounds.length];

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${background} ${className}`}
      aria-label={image ? undefined : `${name} 商品画像はありません`}
      role={image ? undefined : "img"}
    >
      {image ? (
        <ProductImageWithFallback image={image} name={name} preload={priority} sizes={sizes} />
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
