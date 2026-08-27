import type { Metadata } from "next";
import { AddressForm } from "@/components/account/address-form";
import { requireUser } from "@/lib/auth/dal";
import { getAccountProfile } from "@/services/account-service";

export const metadata: Metadata = { title: "地址管理", description: "管理结算默认收货地址。" };
export const dynamic = "force-dynamic";

export default async function AddressPage() {
  const user = await requireUser();
  const profile = await getAccountProfile(user.id);
  if (!profile) return null;

  return (
    <section className="min-h-[75vh] px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Account / Address
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950 sm:text-5xl">
          地址管理
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          保存一条默认地址供结算预填；历史订单保留创建时的地址快照。
        </p>
        <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-9">
          <AddressForm key={profile.updatedAt} address={profile.address} />
        </div>
      </div>
    </section>
  );
}
