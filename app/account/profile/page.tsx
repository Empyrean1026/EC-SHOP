import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/profile-form";
import { requireUser } from "@/lib/auth/dal";
import { getAccountProfile } from "@/services/account-service";

export const metadata: Metadata = {
  title: "プロフィール",
  description: "プロフィールを確認・更新します。",
};
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getAccountProfile(user.id);
  if (!profile) return null;

  return (
    <section className="min-h-[75vh] px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Account / Profile
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950 sm:text-5xl">
          プロフィール
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          メールアドレスと権限はアカウント情報のため変更できません。
        </p>
        <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-9">
          <ProfileForm key={profile.updatedAt} profile={profile} />
        </div>
      </div>
    </section>
  );
}
