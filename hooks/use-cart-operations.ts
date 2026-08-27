"use client";

import { useCallback } from "react";
import { useCartStoreApi } from "@/components/cart/cart-provider";
import {
  addAccountCartItem,
  clearAccountCart,
  removeAccountCartItem,
  updateAccountCartItem,
  type CartClientResult,
} from "@/services/cart-client";
import type { CartOperationResult } from "@/store/cart-store";
import type { CartLine, CartProductSnapshot } from "@/types/cart";

function clientResult(result: CartClientResult): CartOperationResult {
  return result.success ? { success: true } : { success: false, message: result.error.message };
}

export function useCartOperations() {
  const store = useCartStoreApi();

  const addItem = useCallback(
    async (product: CartProductSnapshot, quantity = 1): Promise<CartOperationResult> => {
      const state = store.getState();
      if (state.status === "syncing") {
        return { success: false, message: "购物车正在同步，请稍候。" };
      }

      const previousItems = state.items;
      const localResult = state.addLocalItem(product, quantity);
      if (!localResult.success || state.source === "guest") return localResult;

      store.getState().setStatus("syncing");
      const result = await addAccountCartItem(product.id, quantity);

      if (result.success) {
        store.getState().replaceCart(result.cart, "account");
      } else {
        store.getState().replaceItems(previousItems, "account");
        store.getState().setError(result.error.message);
      }

      store.getState().setStatus("ready");
      return clientResult(result);
    },
    [store],
  );

  const setQuantity = useCallback(
    async (productId: string, quantity: number): Promise<CartOperationResult> => {
      const state = store.getState();
      if (state.status === "syncing") {
        return { success: false, message: "购物车正在同步，请稍候。" };
      }

      const previousItems = state.items;
      const localResult = state.setLocalQuantity(productId, quantity);
      if (!localResult.success || state.source === "guest") return localResult;

      store.getState().setStatus("syncing");
      const result = await updateAccountCartItem(productId, quantity);

      if (result.success) {
        store.getState().replaceCart(result.cart, "account");
      } else {
        store.getState().replaceItems(previousItems, "account");
        store.getState().setError(result.error.message);
      }

      store.getState().setStatus("ready");
      return clientResult(result);
    },
    [store],
  );

  const removeItem = useCallback(
    async (productId: string): Promise<CartOperationResult> => {
      const state = store.getState();
      if (state.status === "syncing") {
        return { success: false, message: "购物车正在同步，请稍候。" };
      }

      const previousItems = state.items;
      state.removeLocalItem(productId);
      if (state.source === "guest") return { success: true };

      store.getState().setStatus("syncing");
      const result = await removeAccountCartItem(productId);

      if (result.success) {
        store.getState().replaceCart(result.cart, "account");
      } else {
        store.getState().replaceItems(previousItems, "account");
        store.getState().setError(result.error.message);
      }

      store.getState().setStatus("ready");
      return clientResult(result);
    },
    [store],
  );

  const clearCart = useCallback(async (): Promise<CartOperationResult> => {
    const state = store.getState();
    if (state.status === "syncing") {
      return { success: false, message: "购物车正在同步，请稍候。" };
    }

    const previousItems = state.items;
    state.clearLocalCart();
    if (state.source === "guest") return { success: true };

    store.getState().setStatus("syncing");
    const result = await clearAccountCart();

    if (result.success) {
      store.getState().replaceCart(result.cart, "account");
    } else {
      store.getState().replaceItems(previousItems, "account");
      store.getState().setError(result.error.message);
    }

    store.getState().setStatus("ready");
    return clientResult(result);
  }, [store]);

  const restoreItems = useCallback(
    (items: CartLine[]) => store.getState().replaceItems(items, store.getState().source),
    [store],
  );

  return { addItem, setQuantity, removeItem, clearCart, restoreItems };
}
