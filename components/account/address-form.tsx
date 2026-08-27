"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/auth/form-field";
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
  const initial = address ?? emptyAddress;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AccountClientError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
      setPending(false);
      return;
    }

    setNotice("默认收货地址已保存。");
    setPending(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("确定删除默认收货地址吗？历史订单中的地址快照不会改变。")) return;
    setPending(true);
    setError(null);
    setNotice(null);
    const result = await deleteAddress();

    if (!result.success) {
      setError(result.error);
      setPending(false);
      return;
    }

    setNotice("默认收货地址已删除。");
    setPending(false);
    router.refresh();
  }

  return (
    <form className="space-y-5" method="post" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="fullName"
          name="fullName"
          label="收件人姓名"
          defaultValue={initial.fullName}
          autoComplete="name"
          required
          error={error?.details?.fullName}
        />
        <FormField
          id="phone"
          name="phone"
          label="联系电话"
          defaultValue={initial.phone}
          autoComplete="tel"
          required
          error={error?.details?.phone}
        />
      </div>
      <FormField
        id="line1"
        name="line1"
        label="详细地址"
        defaultValue={initial.line1}
        autoComplete="address-line1"
        required
        error={error?.details?.line1}
      />
      <FormField
        id="line2"
        name="line2"
        label="楼层、房间等（可选）"
        defaultValue={initial.line2}
        autoComplete="address-line2"
        error={error?.details?.line2}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="city"
          name="city"
          label="城市"
          defaultValue={initial.city}
          autoComplete="address-level2"
          required
          error={error?.details?.city}
        />
        <FormField
          id="state"
          name="state"
          label="都道府县 / 州（可选）"
          defaultValue={initial.state}
          autoComplete="address-level1"
          error={error?.details?.state}
        />
        <FormField
          id="postalCode"
          name="postalCode"
          label="邮政编码"
          defaultValue={initial.postalCode}
          autoComplete="postal-code"
          required
          error={error?.details?.postalCode}
        />
        <FormField
          id="country"
          name="country"
          label="国家代码"
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
          {pending ? "正在处理…" : address ? "更新默认地址" : "保存默认地址"}
        </button>
        {address ? (
          <button
            className="h-12 rounded-full border border-red-200 px-7 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            type="button"
            disabled={pending}
            onClick={handleDelete}
          >
            删除地址
          </button>
        ) : null}
      </div>
    </form>
  );
}
