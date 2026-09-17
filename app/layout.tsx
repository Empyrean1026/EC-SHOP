import type { Metadata } from "next";
import { headers } from "next/headers";
import { CartProvider } from "@/components/cart/cart-provider";
import { ShoppingAssistantErrorBoundary } from "@/components/ai/shopping-assistant-error-boundary";
import { ShoppingAssistantLauncher } from "@/components/ai/shopping-assistant-launcher";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ToastProvider } from "@/components/ui/toast";
import { THEME_STORAGE_KEY } from "@/lib/ui/theme";
import { isShopDemo } from "@/lib/demo";
import "./globals.css";

const themeScript = `(() => {
  try {
    const saved = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    const dark = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.theme = saved || "system";
  } catch {}
})();`;

export const metadata: Metadata = {
  title: {
    default: "EC Site",
    template: "%s | EC Site",
  },
  description: "デスク用品、生活雑貨、ホームフィットネス用品を紹介するポートフォリオ用ECデモです。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="ja-JP"
      className="h-full scroll-smooth"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <ToastProvider>
          <CartProvider>
            <SiteHeader />
            {isShopDemo() && (
              <p className="bg-amber-50 px-5 py-3 text-center text-sm text-stone-900" role="note">
                ポートフォリオ用のデモサイトです。公開環境では注文・決済・AI機能をご利用いただけません。登録には架空の情報をご使用ください。
              </p>
            )}
            <main className="flex-1">{children}</main>
            <SiteFooter />
            {!isShopDemo() && (
              <ShoppingAssistantErrorBoundary>
                <ShoppingAssistantLauncher />
              </ShoppingAssistantErrorBoundary>
            )}
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
