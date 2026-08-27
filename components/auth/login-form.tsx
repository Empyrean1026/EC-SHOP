"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/auth/form-field";
import { synchronizeCartStore, useCartStoreApi } from "@/components/cart/cart-provider";
import { loginUser, type AuthClientError } from "@/services/auth-client";

type LoginFormProps = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const cartStore = useCartStoreApi();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthClientError | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await loginUser({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (!result.success) {
      setError(result.error);
      setPending(false);
      return;
    }

    await synchronizeCartStore(cartStore);
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form className="space-y-5" method="post" onSubmit={handleSubmit} noValidate>
      <FormField
        id="email"
        name="email"
        label="邮箱"
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
        label="密码"
        type="password"
        autoComplete="current-password"
        required
        error={error?.details?.password}
      />

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
        {pending ? "正在登录…" : "登录"}
      </button>
    </form>
  );
}
