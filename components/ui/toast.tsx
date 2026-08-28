"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error" | "info";
type ToastInput = { title: string; description?: string; tone?: ToastTone };
type ToastItem = ToastInput & { id: number; tone: ToastTone };
type ToastApi = {
  show: (toast: ToastInput) => number;
  success: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  info: (title: string, description?: string) => number;
};

const ToastContext = createContext<ToastApi | null>(null);
let nextToastId = 1;

const toneStyles: Record<ToastTone, { accent: string; icon: string }> = {
  success: { accent: "bg-emerald-500", icon: "✓" },
  error: { accent: "bg-red-500", icon: "!" },
  info: { accent: "bg-orange-500", icon: "i" },
};

function ToastCard({ toast, dismiss }: { toast: ToastItem; dismiss: (id: number) => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(
      () => dismiss(toast.id),
      toast.tone === "error" ? 6000 : 4000,
    );
    return () => window.clearTimeout(timeout);
  }, [dismiss, toast.id, toast.tone]);

  const style = toneStyles[toast.tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 pr-11 text-stone-950 shadow-xl dark:border-stone-700 dark:bg-stone-900 dark:text-white">
      <span className={`absolute inset-y-0 left-0 w-1 ${style.accent}`} aria-hidden="true" />
      <div className="flex gap-3">
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${style.accent}`}
          aria-hidden="true"
        >
          {style.icon}
        </span>
        <div>
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-xs leading-5 text-stone-500">{toast.description}</p>
          ) : null}
        </div>
      </div>
      <button
        aria-label="通知を閉じる"
        className="absolute top-3 right-3 grid size-7 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-950 dark:hover:bg-stone-800 dark:hover:text-white"
        onClick={() => dismiss(toast.id)}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const show = useCallback((input: ToastInput) => {
    const id = nextToastId++;
    setToasts((current) => [...current.slice(-3), { ...input, id, tone: input.tone ?? "info" }]);
    return id;
  }, []);
  const value = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description) => show({ title, description, tone: "success" }),
      error: (title, description) => show({ title, description, tone: "error" }),
      info: (title, description) => show({ title, description, tone: "info" }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-atomic="false"
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div className="pointer-events-auto" key={toast.id}>
            <ToastCard dismiss={dismiss} toast={toast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
