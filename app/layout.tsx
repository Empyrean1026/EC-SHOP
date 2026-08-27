import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EC Site",
    template: "%s | EC Site",
  },
  description: "基于 Next.js、TypeScript 与 MongoDB 构建的现代化全栈电商平台。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full scroll-smooth" data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col antialiased">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
