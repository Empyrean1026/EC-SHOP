"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImageWithFallbackProps = {
  image: string;
  name: string;
  preload: boolean;
  sizes: string;
};

export function ProductImageWithFallback({
  image,
  name,
  preload,
  sizes,
}: ProductImageWithFallbackProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);

  if (failedImage === image) {
    return (
      <div
        aria-label={`${name} 商品画像はありません`}
        className="absolute inset-0 grid place-items-center"
        role="img"
      >
        <span className="text-5xl font-semibold tracking-[-0.08em] text-stone-900/20 uppercase">
          {name.slice(0, 2)}
        </span>
      </div>
    );
  }

  return (
    <Image
      alt={name}
      className="size-full object-cover transition duration-500 group-hover:scale-[1.02]"
      decoding="async"
      fill
      loading={preload ? undefined : "lazy"}
      onError={() => setFailedImage(image)}
      preload={preload}
      referrerPolicy="no-referrer"
      sizes={sizes}
      src={image}
      unoptimized={/^https?:\/\//i.test(image) || /\.svg$/i.test(image)}
    />
  );
}
