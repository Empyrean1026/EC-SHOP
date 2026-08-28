"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/auth/form-field";
import { synchronizeCartStore, useCartStoreApi } from "@/components/cart/cart-provider";
import { registerUser, type AuthClientError } from "@/services/auth-client";

export function RegisterForm() {
  const router = useRouter();
  const cartStore = useCartStoreApi();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthClientError | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await registerUser({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });

    if (!result.success) {
      setError(result.error);
      setPending(false);
      return;
    }

    await synchronizeCartStore(cartStore);
    router.replace("/account");
    router.refresh();
  }

  return (
    <form className="space-y-5" method="post" onSubmit={handleSubmit} noValidate>
      <FormField
        id="name"
        name="name"
        label="氏名"
        type="text"
        autoComplete="name"
        required
        error={error?.details?.name}
      />
      <FormField
        id="email"
        name="email"
        label="メールアドレス"
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        error={error?.details?.email}
      />
      <FormField
        id="password"
        name="password"
        label="パスワード"
        type="password"
        autoComplete="new-password"
        required
        error={error?.details?.password}
      />
      <FormField
        id="confirmPassword"
        name="confirmPassword"
        label="パスワード（確認）"
        type="password"
        autoComplete="new-password"
        required
        error={error?.details?.confirmPassword}
      />
      <p className="text-xs leading-5 text-stone-500">
        パスワードは8文字以上で、英大文字・英小文字・数字をそれぞれ1文字以上含めてください。
      </p>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error.message}
        </p>
      ) : null}

      <button
        className="h-12 w-full rounded-full bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "アカウントを作成しています…" : "アカウントを作成"}
      </button>
    </form>
  );
}
