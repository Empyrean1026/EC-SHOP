import { createStore } from "zustand/vanilla";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import {
  CART_MAX_DISTINCT_ITEMS,
  CART_MAX_QUANTITY,
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
} from "@/lib/cart/constants";
import { calculateCartTotals, calculateTotalQuantity } from "@/lib/cart/totals";
import { isHttpOrPublicAssetUrl } from "@/models/validators";
import type { CartAdjustment, CartLine, CartProductSnapshot, ShoppingCart } from "@/types/cart";

export type CartSource = "guest" | "account";
export type CartStatus = "initializing" | "ready" | "syncing";

export type CartOperationResult = { success: true } | { success: false; message: string };

type PersistedCartState = {
  items: CartLine[];
};

const safeBrowserStorage: StateStorage = {
  getItem(name) {
    try {
      return typeof window === "undefined" ? null : window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(name, value);
    } catch {
      // A full or disabled storage area must not break cart interactions.
    }
  },
  removeItem(name) {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(name);
    } catch {
      // The in-memory store can still be cleared.
    }
  },
};

export type CartStoreState = {
  items: CartLine[];
  itemCount: number;
  totalQuantity: number;
  totals: ShoppingCart["totals"];
  adjustments: CartAdjustment[];
  source: CartSource;
  status: CartStatus;
  hydrated: boolean;
  error: string | null;
  addLocalItem: (product: CartProductSnapshot, quantity?: number) => CartOperationResult;
  setLocalQuantity: (productId: string, quantity: number) => CartOperationResult;
  removeLocalItem: (productId: string) => void;
  clearLocalCart: () => void;
  replaceCart: (cart: ShoppingCart, source: CartSource) => void;
  replaceItems: (items: CartLine[], source: CartSource) => void;
  setStatus: (status: CartStatus) => void;
  setError: (error: string | null) => void;
  markHydrated: () => void;
  resetToGuest: () => void;
};

function isSafeInteger(value: unknown, minimum = 0): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;
}

function isSafeImageUrl(value: unknown): value is string | null {
  if (value === null) return true;
  return typeof value === "string" && value.length <= 2048 && isHttpOrPublicAssetUrl(value);
}

function isProductSnapshot(value: unknown): value is CartProductSnapshot {
  if (!value || typeof value !== "object") return false;

  const product = value as Record<string, unknown>;

  return (
    typeof product.id === "string" &&
    /^[a-f\d]{24}$/i.test(product.id) &&
    typeof product.name === "string" &&
    product.name.length >= 2 &&
    product.name.length <= 200 &&
    typeof product.slug === "string" &&
    product.slug.length >= 2 &&
    product.slug.length <= 220 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) &&
    typeof product.price === "number" &&
    isSafeInteger(product.price) &&
    ["jpy", "usd", "cny"].includes(String(product.currency)) &&
    isSafeImageUrl(product.image) &&
    isSafeInteger(product.stock)
  );
}

export function sanitizeGuestCartItems(value: unknown): CartLine[] {
  if (!value || typeof value !== "object") return [];

  const candidate = value as { items?: unknown };
  if (!Array.isArray(candidate.items)) return [];

  const seenProductIds = new Set<string>();
  const items: CartLine[] = [];

  for (const itemValue of candidate.items) {
    if (items.length >= CART_MAX_DISTINCT_ITEMS) break;
    if (!itemValue || typeof itemValue !== "object") continue;

    const item = itemValue as { product?: unknown; quantity?: unknown };
    if (!isProductSnapshot(item.product) || !isSafeInteger(item.quantity, 1)) continue;
    if (item.product.stock <= 0 || seenProductIds.has(item.product.id)) continue;

    const quantity = Math.min(item.quantity, item.product.stock, CART_MAX_QUANTITY);
    seenProductIds.add(item.product.id);
    items.push({
      product: item.product,
      quantity,
      subtotal: item.product.price * quantity,
    });
  }

  return items;
}

function derivedCartState(items: CartLine[]) {
  return {
    items,
    itemCount: items.length,
    totalQuantity: calculateTotalQuantity(items),
    totals: calculateCartTotals(items),
  };
}

export function createCartStore() {
  return createStore<CartStoreState>()(
    persist<CartStoreState, [], [], PersistedCartState>(
      (set, get) => ({
        ...derivedCartState([]),
        adjustments: [],
        source: "guest",
        status: "initializing",
        hydrated: false,
        error: null,

        addLocalItem(product, quantity = 1) {
          if (product.stock <= 0) {
            return { success: false, message: "この商品は在庫切れです。" };
          }

          const items = [...get().items];
          const index = items.findIndex((item) => item.product.id === product.id);
          const nextQuantity = (index >= 0 ? items[index]!.quantity : 0) + quantity;
          const maximum = Math.min(product.stock, CART_MAX_QUANTITY);

          if (nextQuantity > maximum) {
            return { success: false, message: `現在購入できるのは最大${maximum} 点。` };
          }

          if (index < 0 && items.length >= CART_MAX_DISTINCT_ITEMS) {
            return { success: false, message: "カートに追加できる商品は最大100種類です。" };
          }

          const nextItem = {
            product,
            quantity: nextQuantity,
            subtotal: product.price * nextQuantity,
          };

          if (index >= 0) items[index] = nextItem;
          else items.push(nextItem);

          set({ ...derivedCartState(items), adjustments: [], error: null });
          return { success: true };
        },

        setLocalQuantity(productId, quantity) {
          const items = [...get().items];
          const index = items.findIndex((item) => item.product.id === productId);

          if (index < 0) return { success: false, message: "カートにこの商品はありません。" };

          const current = items[index]!;
          const maximum = Math.min(current.product.stock, CART_MAX_QUANTITY);

          if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > maximum) {
            return { success: false, message: `数量は1〜${maximum}点で指定してください。` };
          }

          items[index] = {
            ...current,
            quantity,
            subtotal: current.product.price * quantity,
          };
          set({ ...derivedCartState(items), adjustments: [], error: null });
          return { success: true };
        },

        removeLocalItem(productId) {
          const items = get().items.filter((item) => item.product.id !== productId);
          set({ ...derivedCartState(items), adjustments: [], error: null });
        },

        clearLocalCart() {
          set({ ...derivedCartState([]), adjustments: [], error: null });
        },

        replaceCart(cart, source) {
          set({
            ...derivedCartState(cart.items),
            adjustments: cart.adjustments,
            source,
            error: null,
          });
        },

        replaceItems(items, source) {
          set({ ...derivedCartState(items), adjustments: [], source });
        },

        setStatus(status) {
          set({ status });
        },

        setError(error) {
          set({ error });
        },

        markHydrated() {
          set({ hydrated: true });
        },

        resetToGuest() {
          set({
            ...derivedCartState([]),
            adjustments: [],
            source: "guest",
            status: "ready",
            hydrated: true,
            error: null,
          });
        },
      }),
      {
        name: CART_STORAGE_KEY,
        version: CART_STORAGE_VERSION,
        storage: createJSONStorage(() => safeBrowserStorage),
        skipHydration: true,
        partialize: (state) => ({ items: state.source === "guest" ? state.items : [] }),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...derivedCartState(sanitizeGuestCartItems(persistedState)),
        }),
      },
    ),
  );
}

export type CartStore = ReturnType<typeof createCartStore>;
