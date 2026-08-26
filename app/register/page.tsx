import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "注册",
  description: "创建 EC Site 账户。",
};

export default function RegisterPage() {
  return (
    <AuthPageShell
      eyebrow="Create account"
      title="创建账户"
      description="密码只会以 bcrypt 哈希形式保存；注册成功后将自动建立安全登录状态。"
      alternateText="已经拥有账户？"
      alternateHref="/login"
      alternateLabel="前往登录"
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
