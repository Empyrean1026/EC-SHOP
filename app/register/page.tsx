import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "新規登録",
  description: "EC Siteのアカウントを作成します。",
};

export default function RegisterPage() {
  return (
    <AuthPageShell
      eyebrow="Create account"
      title="アカウントを作成"
      description="お気に入りや注文履歴を利用するためのアカウントを作成します。"
      alternateText="すでにアカウントをお持ちですか？"
      alternateHref="/login"
      alternateLabel="ログイン"
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
