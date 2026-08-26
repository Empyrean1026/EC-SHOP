import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "无权访问",
};

export default function ForbiddenPage() {
  return (
    <section className="grid min-h-[calc(100vh-8rem)] place-items-center bg-stone-100 px-5 py-16 text-center">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
          403 / Forbidden
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-stone-950">
          当前账户没有访问权限
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-stone-600">
          此区域仅允许管理员访问。你的登录状态仍然有效，可以返回用户中心。
        </p>
        <Link
          className="mt-8 inline-flex rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white"
          href="/account"
        >
          返回用户中心
        </Link>
      </div>
    </section>
  );
}
