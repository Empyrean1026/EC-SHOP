"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/auth/form-field";
import { useToast } from "@/components/ui/toast";
import { updateProfile, type AccountClientError } from "@/services/account-client";
import type { AccountProfile } from "@/types/account";

export function ProfileForm({ profile }: { profile: AccountProfile }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AccountClientError | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const data = new FormData(event.currentTarget);
    const result = await updateProfile({
      name: String(data.get("name") ?? ""),
      avatar: String(data.get("avatar") ?? ""),
    });

    if (!result.success) {
      setError(result.error);
      toast.error("プロフィールを保存できません", result.error.message);
      setPending(false);
      return;
    }

    setSaved(true);
    toast.success("プロフィールを保存しました");
    setPending(false);
    router.refresh();
  }

  return (
    <form className="space-y-5" method="post" onSubmit={handleSubmit} noValidate>
      <div className="flex items-center gap-4 rounded-2xl bg-stone-100 p-4">
        {profile.avatar ? (
          <Image
            className="size-16 rounded-full object-cover"
            src={profile.avatar}
            alt="現在のプロフィール画像"
            width={64}
            height={64}
            loading="lazy"
            referrerPolicy="no-referrer"
            unoptimized
          />
        ) : (
          <div className="grid size-16 place-items-center rounded-full bg-stone-950 text-xl font-semibold text-white">
            {profile.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-stone-950">プロフィール画像</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            URLを入力しない場合は、氏名の頭文字を表示します。
          </p>
        </div>
      </div>

      <FormField
        id="name"
        name="name"
        label="氏名"
        type="text"
        autoComplete="name"
        defaultValue={profile.name}
        required
        error={error?.details?.name}
      />
      <FormField
        id="avatar"
        name="avatar"
        label="プロフィール画像URL（任意）"
        type="url"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="https://example.com/avatar.jpg"
        defaultValue={profile.avatar ?? ""}
        error={error?.details?.avatar}
      />

      <div className="rounded-xl border border-stone-200 px-4 py-3">
        <p className="text-xs text-stone-500">メールアドレス（変更不可）</p>
        <p className="mt-1 text-sm font-semibold break-all text-stone-900">{profile.email}</p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error.message}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          プロフィールを保存しました。
        </p>
      ) : null}

      <button
        className="h-12 rounded-full bg-stone-950 px-7 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "保存しています…" : "プロフィールを保存"}
      </button>
    </form>
  );
}
