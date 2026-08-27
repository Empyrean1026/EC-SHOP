"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, type FormEvent } from "react";
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
      toast.error("个人资料保存失败", result.error.message);
      setPending(false);
      return;
    }

    setSaved(true);
    toast.success("个人资料已保存");
    setPending(false);
    router.refresh();
  }

  return (
    <form className="space-y-5" method="post" onSubmit={handleSubmit} noValidate>
      <div className="flex items-center gap-4 rounded-2xl bg-stone-100 p-4">
        {profile.avatar ? (
          <img
            className="size-16 rounded-full object-cover"
            src={profile.avatar}
            alt="当前头像"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="grid size-16 place-items-center rounded-full bg-stone-950 text-xl font-semibold text-white">
            {profile.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-stone-950">公开头像</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">未填写网址时显示姓名首字母。</p>
        </div>
      </div>

      <FormField
        id="name"
        name="name"
        label="姓名"
        type="text"
        autoComplete="name"
        defaultValue={profile.name}
        required
        error={error?.details?.name}
      />
      <FormField
        id="avatar"
        name="avatar"
        label="头像网址（可选）"
        type="url"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="https://example.com/avatar.jpg"
        defaultValue={profile.avatar ?? ""}
        error={error?.details?.avatar}
      />

      <div className="rounded-xl border border-stone-200 px-4 py-3">
        <p className="text-xs text-stone-500">登录邮箱（当前不可修改）</p>
        <p className="mt-1 text-sm font-semibold break-all text-stone-900">{profile.email}</p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error.message}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          个人资料已保存。
        </p>
      ) : null}

      <button
        className="h-12 rounded-full bg-stone-950 px-7 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "正在保存…" : "保存个人资料"}
      </button>
    </form>
  );
}
