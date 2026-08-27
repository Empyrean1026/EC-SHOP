"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import {
  synchronizeCartStore,
  useCartStore,
  useCartStoreApi,
} from "@/components/cart/cart-provider";
import { ProductVisual } from "@/components/products/product-visual";
import { formatProductPrice } from "@/lib/products/format";
import { checkoutFormSchema, type CheckoutFormInput } from "@/lib/validations/checkout";
import { submitCheckoutOrder } from "@/services/checkout-client";
import type { ShoppingCart } from "@/types/cart";
import type { CheckoutPageData } from "@/types/checkout";

type CheckoutFieldProps = {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
};

const emptyCart: ShoppingCart = {
  items: [],
  itemCount: 0,
  totalQuantity: 0,
  totals: [],
  adjustments: [],
};

function CheckoutField({
  id,
  label,
  registration,
  error,
  autoComplete,
  placeholder,
}: CheckoutFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800" htmlFor={id}>
        {label}
      </label>
      <input
        {...registration}
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-950 transition outline-none placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
        id={id}
        placeholder={placeholder}
      />
      {error ? (
        <p className="mt-2 text-xs text-red-700" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CheckoutSummary({ cart }: { cart: ShoppingCart }) {
  return (
    <aside className="rounded-3xl bg-stone-950 p-6 text-white lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold tracking-[0.16em] text-orange-400 uppercase">
          Order summary
        </p>
        <Link className="text-xs text-stone-400 underline hover:text-white" href="/cart">
          返回修改
        </Link>
      </div>

      <div className="mt-6 max-h-[25rem] divide-y divide-white/10 overflow-y-auto pr-1">
        {cart.items.map((item) => (
          <article className="grid grid-cols-[3.5rem_1fr_auto] gap-3 py-4" key={item.product.id}>
            <ProductVisual
              className="aspect-square rounded-xl"
              image={item.product.image ?? undefined}
              name={item.product.name}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.product.name}</p>
              <p className="mt-1 text-xs text-stone-400">数量 {item.quantity}</p>
            </div>
            <p className="text-right text-xs font-semibold">
              {formatProductPrice(item.subtotal, item.product.currency)}
            </p>
          </article>
        ))}
      </div>

      <dl className="mt-5 space-y-3 border-t border-white/15 pt-5 text-sm">
        <div className="flex justify-between gap-4 text-stone-400">
          <dt>商品数量</dt>
          <dd className="font-semibold text-white">{cart.totalQuantity} 件</dd>
        </div>
        <div className="flex justify-between gap-4 text-stone-400">
          <dt>配送费</dt>
          <dd className="font-semibold text-white">本阶段免运费</dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-white/15 pt-5">
        <p className="text-xs text-stone-400">订单总额</p>
        {cart.totals.map((total) => (
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]" key={total.currency}>
            {formatProductPrice(total.amount, total.currency)}
          </p>
        ))}
      </div>
    </aside>
  );
}

export function CheckoutForm({ initialData }: { initialData: CheckoutPageData }) {
  const router = useRouter();
  const cartStore = useCartStoreApi();
  const items = useCartStore((state) => state.items);
  const totals = useCartStore((state) => state.totals);
  const totalQuantity = useCartStore((state) => state.totalQuantity);
  const source = useCartStore((state) => state.source);
  const status = useCartStore((state) => state.status);
  const hydrated = useCartStore((state) => state.hydrated);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const usingLiveCart = hydrated && status === "ready";
  const cart: ShoppingCart = usingLiveCart
    ? {
        items,
        itemCount: items.length,
        totalQuantity,
        totals,
        adjustments: cartStore.getState().adjustments,
      }
    : initialData.cart;
  const form = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onBlur",
    defaultValues: {
      shippingAddress: initialData.defaultAddress,
      paymentMethod: "stripe",
      saveAddress: true,
      confirmOrder: false,
    },
  });
  const selectedPaymentMethod = useWatch({ control: form.control, name: "paymentMethod" });

  async function submit(values: CheckoutFormInput) {
    form.clearErrors("root");

    if (!usingLiveCart || source !== "account") {
      form.setError("root.server", { message: "账户购物车尚未同步，请稍候后重试。" });
      return;
    }

    if (cart.items.length === 0) {
      form.setError("root.server", { message: "购物车为空，无法创建订单。" });
      return;
    }

    if (cart.totals.length !== 1) {
      form.setError("root.server", { message: "一次结算只能包含同一种币种。" });
      return;
    }

    const checkoutKey = idempotencyKey ?? window.crypto.randomUUID();
    if (!idempotencyKey) setIdempotencyKey(checkoutKey);
    const result = await submitCheckoutOrder({
      ...values,
      idempotencyKey: checkoutKey,
      expectedItems: cart.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        currency: item.product.currency,
      })),
    });

    if (!result.success) {
      if (result.error.code === "UNAUTHENTICATED") {
        router.replace("/login?next=/checkout");
        return;
      }

      if (result.error.code === "CHECKOUT_CART_CHANGED") {
        setIdempotencyKey(null);
        await synchronizeCartStore(cartStore);
      }

      form.setError("root.server", { message: result.error.message });
      return;
    }

    if (result.data.cartCleared) {
      cartStore.getState().replaceCart(emptyCart, "account");
    } else {
      await synchronizeCartStore(cartStore);
    }

    router.push(`/checkout/success/${result.data.order.id}`);
    router.refresh();
  }

  if (!usingLiveCart && initialData.cart.items.length === 0) {
    return (
      <div className="grid min-h-80 place-items-center rounded-3xl border border-stone-200 bg-white">
        <p className="text-sm text-stone-500" role="status">
          正在同步账户购物车…
        </p>
      </div>
    );
  }

  if (usingLiveCart && cart.items.length === 0) {
    return (
      <div className="grid min-h-[28rem] place-items-center rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-orange-600 uppercase">
            Nothing to checkout
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
            购物车还是空的
          </h2>
          <p className="mt-3 text-sm text-stone-500">请先加入商品，再返回结算。</p>
          <Link
            className="mt-7 inline-flex h-11 items-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white hover:bg-orange-600"
            href="/products"
          >
            浏览商品
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start"
      method="post"
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      <div className="space-y-8">
        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-stone-950 text-xs font-semibold text-white">
              1
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.025em] text-stone-950">收货地址</h2>
              <p className="mt-1 text-sm text-stone-500">请填写可正常签收商品的地址。</p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <CheckoutField
              autoComplete="name"
              error={form.formState.errors.shippingAddress?.fullName?.message}
              id="shipping-full-name"
              label="收件人姓名"
              registration={form.register("shippingAddress.fullName")}
            />
            <CheckoutField
              autoComplete="tel"
              error={form.formState.errors.shippingAddress?.phone?.message}
              id="shipping-phone"
              label="联系电话"
              registration={form.register("shippingAddress.phone")}
            />
            <div className="sm:col-span-2">
              <CheckoutField
                autoComplete="address-line1"
                error={form.formState.errors.shippingAddress?.line1?.message}
                id="shipping-line1"
                label="详细地址"
                placeholder="街道、门牌号"
                registration={form.register("shippingAddress.line1")}
              />
            </div>
            <div className="sm:col-span-2">
              <CheckoutField
                autoComplete="address-line2"
                error={form.formState.errors.shippingAddress?.line2?.message}
                id="shipping-line2"
                label="公寓、楼层等（选填）"
                registration={form.register("shippingAddress.line2")}
              />
            </div>
            <CheckoutField
              autoComplete="address-level2"
              error={form.formState.errors.shippingAddress?.city?.message}
              id="shipping-city"
              label="城市 / 区"
              registration={form.register("shippingAddress.city")}
            />
            <CheckoutField
              autoComplete="address-level1"
              error={form.formState.errors.shippingAddress?.state?.message}
              id="shipping-state"
              label="都道府县 / 省（选填）"
              registration={form.register("shippingAddress.state")}
            />
            <CheckoutField
              autoComplete="postal-code"
              error={form.formState.errors.shippingAddress?.postalCode?.message}
              id="shipping-postal-code"
              label="邮政编码"
              registration={form.register("shippingAddress.postalCode")}
            />
            <CheckoutField
              autoComplete="country"
              error={form.formState.errors.shippingAddress?.country?.message}
              id="shipping-country"
              label="国家 / 地区代码"
              placeholder="JP"
              registration={form.register("shippingAddress.country")}
            />
          </div>

          <label className="mt-6 flex items-start gap-3 text-sm text-stone-600">
            <input
              className="mt-0.5 size-4 accent-stone-950"
              type="checkbox"
              {...form.register("saveAddress")}
            />
            保存为账户默认收货地址
          </label>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-stone-950 text-xs font-semibold text-white">
              2
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.025em] text-stone-950">支付方式</h2>
              <p className="mt-1 text-sm text-stone-500">
                本阶段创建订单，Stripe 扣款将在后续阶段接入。
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <label
              className={`cursor-pointer rounded-2xl border p-5 transition ${
                selectedPaymentMethod === "stripe"
                  ? "border-orange-500 bg-orange-50"
                  : "border-stone-200 hover:border-stone-400"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  className="mt-1 accent-orange-600"
                  type="radio"
                  value="stripe"
                  {...form.register("paymentMethod")}
                />
                <span>
                  <span className="block text-sm font-semibold text-stone-950">
                    Stripe 在线支付
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-stone-500">
                    创建待支付订单，下一阶段进入安全支付。
                  </span>
                </span>
              </div>
            </label>
            <label
              className={`cursor-pointer rounded-2xl border p-5 transition ${
                selectedPaymentMethod === "cash_on_delivery"
                  ? "border-orange-500 bg-orange-50"
                  : "border-stone-200 hover:border-stone-400"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  className="mt-1 accent-orange-600"
                  type="radio"
                  value="cash_on_delivery"
                  {...form.register("paymentMethod")}
                />
                <span>
                  <span className="block text-sm font-semibold text-stone-950">货到付款</span>
                  <span className="mt-1 block text-xs leading-5 text-stone-500">
                    订单创建后等待商家确认配送。
                  </span>
                </span>
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-stone-950 text-xs font-semibold text-white">
              3
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.025em] text-stone-950">最终确认</h2>
              <p className="mt-1 text-sm text-stone-500">提交时服务器会再次核对价格和库存。</p>
            </div>
          </div>

          <label className="mt-7 flex items-start gap-3 rounded-2xl bg-stone-100 p-4 text-sm leading-6 text-stone-700">
            <input
              className="mt-1 size-4 shrink-0 accent-orange-600"
              type="checkbox"
              {...form.register("confirmOrder")}
            />
            我已确认商品、数量、配送地址和右侧订单总额。
          </label>
          {form.formState.errors.confirmOrder?.message ? (
            <p className="mt-2 text-xs text-red-700">
              {form.formState.errors.confirmOrder.message}
            </p>
          ) : null}

          {cart.totals.length !== 1 ? (
            <p
              className="mt-5 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900"
              role="alert"
            >
              当前购物车包含多个币种，请返回购物车拆分后再结算。
            </p>
          ) : null}

          {usingLiveCart && source !== "account" ? (
            <p
              className="mt-5 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900"
              role="alert"
            >
              账户购物车尚未完成同步，请刷新页面后重试；本地商品不会丢失。
            </p>
          ) : null}

          {form.formState.errors.root?.server?.message ? (
            <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {form.formState.errors.root.server.message}
            </p>
          ) : null}

          <button
            className="mt-6 h-12 w-full rounded-full bg-orange-600 px-6 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              form.formState.isSubmitting ||
              !usingLiveCart ||
              source !== "account" ||
              cart.totals.length !== 1
            }
            type="submit"
          >
            {form.formState.isSubmitting
              ? "正在安全创建订单…"
              : selectedPaymentMethod === "stripe"
                ? "创建待支付订单"
                : "创建货到付款订单"}
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-stone-500">
            当前不会发起 Stripe 扣款；重复提交同一结算请求不会重复创建订单。
          </p>
        </section>
      </div>

      <CheckoutSummary cart={cart} />
    </form>
  );
}
