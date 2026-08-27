"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { addWishlistItem, removeWishlistItem } from "@/services/account-client";

type WishlistButtonProps = {
  productId: string;
  initialWishlisted?: boolean;
  compact?: boolean;
};

export function WishlistButton({
  productId,
  initialWishlisted = false,
  compact = false,
}: WishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleWishlist() {
    setPending(true);
    setError(null);
    const result = wishlisted
      ? await removeWishlistItem(productId)
      : await addWishlistItem(productId);

    if (!result.success) {
      if (result.error.code === "UNAUTHENTICATED") {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setError(result.error.message);
      setPending(false);
      return;
    }

    setWishlisted(result.data.wishlisted);
    setPending(false);
    router.refresh();
  }

  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <button
        className={`${compact ? "h-9 w-full text-xs" : "h-12 w-full text-sm"} rounded-full border px-5 font-semibold transition disabled:opacity-60 ${
          wishlisted
            ? "border-orange-200 bg-orange-50 text-orange-700"
            : "border-stone-300 bg-white text-stone-800 hover:border-stone-950"
        }`}
        type="button"
        disabled={pending}
        onClick={toggleWishlist}
        aria-pressed={wishlisted}
      >
        {pending ? "正在更新…" : wishlisted ? "♥ 已收藏" : "♡ 加入收藏"}
      </button>
      {error ? (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
