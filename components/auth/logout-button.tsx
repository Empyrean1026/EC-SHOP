"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStoreApi } from "@/components/cart/cart-provider";
import { logoutUser } from "@/services/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const cartStore = useCartStoreApi();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function logout() {
    setPending(true);
    setFailed(false);

    if (!(await logoutUser())) {
      setPending(false);
      setFailed(true);
      return;
    }

    cartStore.getState().resetToGuest();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div>
      <button
        className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:border-stone-950 disabled:opacity-60"
        type="button"
        onClick={logout}
        disabled={pending}
      >
        {pending ? "ログアウトしています…" : "ログアウト"}
      </button>
      {failed ? (
        <p className="mt-3 text-xs text-red-700" role="alert">
          ログアウトできませんでした。ページを再読み込みしてお試しください。
        </p>
      ) : null}
    </div>
  );
}
