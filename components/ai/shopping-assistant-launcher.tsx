"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ShoppingAssistantPanel = dynamic(
  () =>
    import("@/components/ai/shopping-assistant-panel").then(
      (module) => module.ShoppingAssistantPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="fixed right-5 bottom-20 z-40 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs font-medium text-stone-600 shadow-lg dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
        role="status"
      >
        AIアシスタントを準備しています…
      </div>
    ),
  },
);

const hiddenRoutePrefixes = ["/admin", "/login", "/register", "/checkout", "/forbidden"];
const panelId = "shopping-assistant-panel";

function isHiddenRoute(pathname: string): boolean {
  return hiddenRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function ShoppingAssistantLauncher() {
  const pathname = usePathname();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const hidden = isHiddenRoute(pathname);

  useEffect(() => {
    if (!hidden) return;
    const timeout = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timeout);
  }, [hidden]);

  function openPanel() {
    setHasOpened(true);
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }

  if (hidden) return null;

  return (
    <>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label="AIショッピングアシスタントを開く"
        className="fixed right-5 bottom-5 z-40 flex h-12 items-center gap-2 rounded-full bg-stone-950 px-5 text-sm font-semibold text-white shadow-xl shadow-stone-950/20 transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 sm:right-6 sm:bottom-6 dark:bg-orange-600 dark:hover:bg-orange-500"
        data-testid="shopping-assistant-launcher"
        onClick={openPanel}
        ref={launcherRef}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M12 3l1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" />
          <path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
        </svg>
        AIに相談
      </button>

      {hasOpened ? <ShoppingAssistantPanel id={panelId} onClose={closePanel} open={open} /> : null}
    </>
  );
}
