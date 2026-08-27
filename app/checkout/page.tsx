import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCurrentUser } from "@/lib/auth/dal";
import { getCheckoutPageData } from "@/services/checkout-service";

export const metadata: Metadata = {
  title: "结算",
  description: "确认商品、配送地址和支付方式并创建订单。",
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");

  const initialData = await getCheckoutPageData(user.id, user.name);

  return (
    <section className="min-h-[75vh] bg-stone-100 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-stone-300 pb-10">
          <p className="text-xs font-semibold tracking-[0.18em] text-orange-600 uppercase">
            Phase 07 / Checkout
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] text-stone-950 sm:text-6xl">
            确认并创建订单
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            地址和支付方式由你确认；商品、库存与金额将在服务端重新计算。
          </p>
        </div>

        <div className="mt-8">
          <CheckoutForm initialData={initialData} />
        </div>
      </div>
    </section>
  );
}
