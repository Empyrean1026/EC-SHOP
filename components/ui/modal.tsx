"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";

type ModalProps = {
  id?: string;
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "center" | "drawer";
};

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function Modal({
  id,
  open,
  onClose,
  title,
  description,
  children,
  size = "sm",
  variant = "center",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={
        variant === "drawer"
          ? "fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden rounded-none border-0 border-l border-stone-200 bg-white p-0 text-stone-950 shadow-2xl backdrop:bg-stone-950/65 backdrop:backdrop-blur-sm sm:inset-y-4 sm:right-4 sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:max-w-[28rem] sm:rounded-[2rem] sm:border dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
          : `m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${sizes[size]} overflow-y-auto rounded-[1.75rem] border border-stone-200 bg-white p-0 text-stone-950 shadow-2xl backdrop:bg-stone-950/65 backdrop:backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50`
      }
      id={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={closeFromBackdrop}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
      ref={dialogRef}
    >
      <div
        className={
          variant === "drawer" ? "flex h-full min-h-0 w-full flex-col" : "w-full p-6 sm:p-8"
        }
      >
        <div
          className={
            variant === "drawer"
              ? "flex shrink-0 items-start justify-between gap-5 border-b border-stone-200 px-5 py-5 sm:px-6 dark:border-stone-700"
              : "flex items-start justify-between gap-5"
          }
        >
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.025em]" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-stone-500" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="ダイアログを閉じる"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-stone-200 text-lg text-stone-500 transition hover:border-stone-400 hover:text-stone-950 dark:border-stone-700 dark:hover:text-white"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className={variant === "drawer" ? "min-h-0 flex-1" : "mt-6"}>{children}</div>
      </div>
    </dialog>
  );
}
