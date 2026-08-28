import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "ログイン",
  description: "EC Siteのアカウントにログインします。",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

function getSafeRedirectPath(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  return path && path.startsWith("/") && !path.startsWith("//") ? path : "/account";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthPageShell
      eyebrow="Welcome back"
      title="ログイン"
      description="ログイン状態はサーバー発行の HttpOnly Cookie に保存され、ブラウザ上のスクリプトから JWT を読み取ることはできません。"
      alternateText="アカウントをお持ちでない方"
      alternateHref="/register"
      alternateLabel="新規登録"
    >
      <LoginForm redirectTo={getSafeRedirectPath(params.next)} />
    </AuthPageShell>
  );
}
