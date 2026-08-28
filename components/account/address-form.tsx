"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/auth/form-field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { deleteAddress, saveAddress, type AccountClientError } from "@/services/account-client";
import type { AccountAddress } from "@/types/account";

const emptyAddress: AccountAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "JP",
};

export function AddressForm({ address }: { address: AccountAddress | null }) {
  const router = useRouter();
  const toast = useToast();
  const initial = address ?? emptyAddress;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AccountClientError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const data = new FormData(event.currentTarget);
    const result = await saveAddress({
      fullName: String(data.get("fullName") ?? ""),
      phone: String(data.get("phone") ?? ""),
      line1: String(data.get("line1") ?? ""),
      line2: String(data.get("line2") ?? ""),
      city: String(data.get("city") ?? ""),
      state: String(data.get("state") ?? ""),
      postalCode: String(data.get("postalCode") ?? ""),
      country: String(data.get("country") ?? ""),
    });

    if (!result.success) {
      setError(result.error);
      toast.error("お届け先を保存できません", result.error.message);
      setPending(false);
      return;
    }

    setNotice("既定のお届け先を保存しました。");
    toast.success("既定のお届け先を保存しました");
    setPending(false);
    router.refresh();
  }

  async function handleDelete() {
    setPending(true);
    setError(null);
    setNotice(null);
    const result = await deleteAddress();

    if (!result.success) {
      setError(result.error);
      toast.error("お届け先を削除できません", result.error.message);
      setPending(false);
      return;
    }

    setNotice("既定のお届け先を削除しました。");
    setDeleteOpen(false);
    toast.success(
      "既定のお届け先を削除しました",
      "過去の注文に保存されたお届け先は変更されません。",
    );
    setPending(false);
    router.refresh();
  }

  return (
    <form className="space-y-5" method="post" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="fullName"
          name="fullName"
          label="お名前"
          defaultValue={initial.fullName}
          autoComplete="name"
          required
          error={error?.details?.fullName}
        />
        <FormField
          id="phone"
          name="phone"
          label="電話番号"
          defaultValue={initial.phone}
          autoComplete="tel"
          required
          error={error?.details?.phone}
        />
      </div>
      <FormField
        id="line1"
        name="line1"
        label="住所"
        defaultValue={initial.line1}
        autoComplete="address-line1"
        required
        error={error?.details?.line1}
      />
      <FormField
        id="line2"
        name="line2"
        label="建物名・部屋番号（任意）"
        defaultValue={initial.line2}
        autoComplete="address-line2"
        error={error?.details?.line2}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="city"
          name="city"
          label="市区町村"
          defaultValue={initial.city}
          autoComplete="address-level2"
          required
          error={error?.details?.city}
        />
        <FormField
          id="state"
          name="state"
          label="都道府県"
          defaultValue={initial.state}
          autoComplete="address-level1"
          error={error?.details?.state}
        />
        <FormField
          id="postalCode"
          name="postalCode"
          label="郵便番号"
          defaultValue={initial.postalCode}
          autoComplete="postal-code"
          required
          error={error?.details?.postalCode}
        />
        <FormField
          id="country"
          name="country"
          label="国コード"
          defaultValue={initial.country}
          autoComplete="country"
          placeholder="JP"
          required
          error={error?.details?.country}
          maxLength={2}
        />
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error.message}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="h-12 rounded-full bg-stone-950 px-7 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? "処理しています…" : address ? "既定のお届け先を更新" : "既定のお届け先を保存"}
        </button>
        {address ? (
          <button
            className="h-12 rounded-full border border-red-200 px-7 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            type="button"
            disabled={pending}
            onClick={() => setDeleteOpen(true)}
          >
            お届け先を削除
          </button>
        ) : null}
      </div>
      <Modal
        description="削除しても、今後の購入手続きで自動入力されなくなるだけで、過去の注文に保存されたお届け先は変更されません。"
        onClose={() => !pending && setDeleteOpen(false)}
        open={deleteOpen}
        title="既定のお届け先を削除しますか？"
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold text-stone-700"
            disabled={pending}
            onClick={() => setDeleteOpen(false)}
            type="button"
          >
            キャンセル
          </button>
          <button
            className="h-11 rounded-full bg-red-700 px-5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={pending}
            onClick={handleDelete}
            type="button"
          >
            {pending ? "削除しています…" : "削除する"}
          </button>
        </div>
      </Modal>
    </form>
  );
}
