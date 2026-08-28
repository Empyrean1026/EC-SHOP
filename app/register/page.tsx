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
      description="パスワードは bcrypt でハッシュ化して保存します。登録完了後は安全にログインした状態になります。"
      alternateText="すでにアカウントをお持ちですか？"
      alternateHref="/login"
      alternateLabel="ログイン"
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
