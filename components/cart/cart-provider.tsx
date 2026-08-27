"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { fetchAccountCart, mergeAccountCart, validateGuestCart } from "@/services/cart-client";
import { createCartStore, type CartStore, type CartStoreState } from "@/store/cart-store";

const CartStoreContext = createContext<CartStore | null>(null);

export async function synchronizeCartStore(store: CartStore): Promise<boolean> {
  const state = store.getState();
  const guestItems = state.source === "guest" ? state.items : [];
  store.getState().setStatus("syncing");
  const accountResult = await fetchAccountCart();

  if (accountResult.authenticated === true) {
    if (guestItems.length > 0) {
      const merged = await mergeAccountCart(guestItems);

      if (!merged.success) {
        // Keep the guest cart persisted so a transient merge failure can be retried
        // on the next page load without losing locally selected items.
        store.getState().setError(merged.error.message);
        store.getState().setStatus("ready");
        return true;
      }

      store.getState().replaceCart(merged.cart, "account");
    } else {
      store.getState().replaceCart(accountResult.cart, "account");
    }

    store.getState().setStatus("ready");
    return true;
  }

  if (accountResult.authenticated === false) {
    if (guestItems.length > 0) {
      const validated = await validateGuestCart(guestItems);

      if (validated.success) {
        store.getState().replaceCart(validated.cart, "guest");
      } else {
        store.getState().setError(validated.error.message);
      }
    }

    store.getState().setStatus("ready");
    return false;
  }

  store.getState().setError(accountResult.error.message);
  store.getState().setStatus("ready");
  return false;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createCartStore);

  useEffect(() => {
    let active = true;

    async function initializeCart() {
      await store.persist.rehydrate();
      if (!active) return;
      store.getState().markHydrated();
      await synchronizeCartStore(store);
    }

    void initializeCart();

    return () => {
      active = false;
    };
  }, [store]);

  return <CartStoreContext.Provider value={store}>{children}</CartStoreContext.Provider>;
}

export function useCartStoreApi(): CartStore {
  const store = useContext(CartStoreContext);

  if (!store) {
    throw new Error("useCartStoreApi must be used inside CartProvider");
  }

  return store;
}

export function useCartStore<T>(selector: (state: CartStoreState) => T): T {
  return useStore(useCartStoreApi(), selector);
}
