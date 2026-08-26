import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "登录",
  description: "登录 EC Site 账户。",
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
      title="登录账户"
      description="登录状态保存在由服务端签发的 HttpOnly Cookie 中，浏览器脚本无法读取 JWT。"
      alternateText="还没有账户？"
      alternateHref="/register"
      alternateLabel="立即注册"
    >
      <LoginForm redirectTo={getSafeRedirectPath(params.next)} />
    </AuthPageShell>
  );
}
