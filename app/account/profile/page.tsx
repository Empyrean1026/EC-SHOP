import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/profile-form";
import { requireUser } from "@/lib/auth/dal";
import { getAccountProfile } from "@/services/account-service";

export const metadata: Metadata = { title: "个人资料", description: "查看并更新账户个人资料。" };
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
          个人资料
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          邮箱和角色属于身份字段，本阶段保持只读。
        </p>
        <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-9">
          <ProfileForm key={profile.updatedAt} profile={profile} />
        </div>
      </div>
    </section>
  );
}
