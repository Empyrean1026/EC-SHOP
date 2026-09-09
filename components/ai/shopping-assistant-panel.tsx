"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AIProductRecommendationCard } from "@/components/ai/ai-product-recommendation-card";
import { Modal } from "@/components/ui/modal";
import {
  AI_SHOPPING_MESSAGE_MAX_LENGTH,
  getAIShoppingErrorMessage,
  requestAIShopping,
  type AIShoppingClientErrorKind,
} from "@/services/ai-shopping-client";
import type { AIRecommendedProduct } from "@/types/ai";

type ShoppingAssistantPanelProps = {
  id: string;
  open: boolean;
  onClose: () => void;
};

type UserEntry = {
  id: string;
  kind: "user";
  text: string;
};

type LoadingEntry = {
  id: string;
  kind: "loading";
};

type ResultEntry = {
  id: string;
  kind: "result";
  message: string;
  products: AIRecommendedProduct[];
};

type ErrorEntry = {
  id: string;
  kind: "error";
  message: string;
  originalMessage: string;
  errorKind: AIShoppingClientErrorKind;
};

type TranscriptEntry = UserEntry | LoadingEntry | ResultEntry | ErrorEntry;
type RequestStatus = "idle" | "loading";

const quickQuestions = [
  "5,000円以内で商品を探して",
  "デスク周りのおすすめを教えて",
  "自宅トレーニング用品を探して",
  "おすすめの商品を教えて",
];

function UserMessage({ text }: { text: string }) {
  return (
    <div className="ml-auto max-w-[88%] rounded-3xl rounded-br-lg bg-stone-950 px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-white dark:bg-stone-100 dark:text-stone-950">
      {text}
    </div>
  );
}

function AssistantMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[92%] rounded-3xl rounded-bl-lg bg-stone-100 px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-stone-700 dark:bg-stone-800 dark:text-stone-200">
      {children}
    </div>
  );
}

function LoadingMessage() {
  return (
    <div
      className="flex max-w-[92%] items-center gap-3 rounded-3xl rounded-bl-lg bg-stone-100 px-4 py-3 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300"
      role="status"
    >
      <span className="flex gap-1" aria-hidden="true">
        <span className="size-1.5 rounded-full bg-orange-500 motion-safe:animate-pulse" />
        <span className="size-1.5 rounded-full bg-orange-500 [animation-delay:120ms] motion-safe:animate-pulse" />
        <span className="size-1.5 rounded-full bg-orange-500 [animation-delay:240ms] motion-safe:animate-pulse" />
      </span>
      商品を探しています…
    </div>
  );
}

export function ShoppingAssistantPanel({ id, open, onClose }: ShoppingAssistantPanelProps) {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const sequenceRef = useRef(0);
  const requestRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const characterCount = input.length;
  const inputTooLong = characterCount > AI_SHOPPING_MESSAGE_MAX_LENGTH;
  const canSend = status === "idle" && input.trim().length > 0 && !inputTooLong;

  useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!open) return;
    const container = messagesRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [entries, open]);

  function nextId(prefix: string): string {
    sequenceRef.current += 1;
    return `${prefix}-${sequenceRef.current}`;
  }

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();

    if (
      requestRef.current ||
      message.length === 0 ||
      message.length > AI_SHOPPING_MESSAGE_MAX_LENGTH
    ) {
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("loading");
    setInput("");

    const loadingId = nextId("assistant-loading");
    setEntries((current) => [
      ...current,
      { id: nextId("user"), kind: "user", text: message },
      { id: loadingId, kind: "loading" },
    ]);

    const result = await requestAIShopping(message, controller.signal);

    if (result.success) {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === loadingId
            ? {
                id: nextId("assistant-result"),
                kind: "result",
                message: result.data.message,
                products: result.data.products,
              }
            : entry,
        ),
      );
    } else if (result.error.kind === "aborted") {
      setEntries((current) => current.filter((entry) => entry.id !== loadingId));
    } else {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === loadingId
            ? {
                id: nextId("assistant-error"),
                kind: "error",
                message: getAIShoppingErrorMessage(result.error.kind),
                originalMessage: message,
                errorKind: result.error.kind,
              }
            : entry,
        ),
      );
    }

    if (requestRef.current === controller) {
      requestRef.current = null;
      setStatus("idle");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSend) void sendMessage(input);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <Modal
      description="ご希望やご予算に合わせて、ショップ内の実在する商品をご提案します。"
      id={id}
      onClose={onClose}
      open={open}
      title="AIショッピングアシスタント"
      variant="drawer"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div
          aria-busy={status === "loading"}
          aria-live="polite"
          aria-relevant="additions text"
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
          data-testid="assistant-messages"
          ref={messagesRef}
          role="log"
        >
          {entries.length === 0 ? (
            <section
              aria-labelledby="assistant-welcome-title"
              className="rounded-3xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-700 dark:bg-stone-800/60"
            >
              <p
                className="text-base font-semibold text-stone-950 dark:text-stone-50"
                id="assistant-welcome-title"
              >
                こんにちは。商品選びをお手伝いします。
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                ご予算や用途を入力してください。ショップにある商品からご提案します。
              </p>
              <div className="mt-5 grid gap-2">
                {quickQuestions.map((question) => (
                  <button
                    className="min-h-11 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-left text-xs leading-5 font-medium text-stone-700 transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                    disabled={status === "loading"}
                    key={question}
                    onClick={() => void sendMessage(question)}
                    type="button"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <div className="grid gap-5">
              {entries.map((entry) => {
                if (entry.kind === "user") {
                  return <UserMessage key={entry.id} text={entry.text} />;
                }

                if (entry.kind === "loading") {
                  return <LoadingMessage key={entry.id} />;
                }

                if (entry.kind === "error") {
                  return (
                    <div className="grid gap-3" data-error-kind={entry.errorKind} key={entry.id}>
                      <AssistantMessage>{entry.message}</AssistantMessage>
                      <button
                        className="w-fit rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 transition hover:border-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:text-stone-200"
                        disabled={status === "loading"}
                        onClick={() => void sendMessage(entry.originalMessage)}
                        type="button"
                      >
                        もう一度試す
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid gap-3" key={entry.id}>
                    <AssistantMessage>{entry.message}</AssistantMessage>
                    {entry.products.length > 0 ? (
                      <div className="grid gap-3">
                        {entry.products.map((product) => (
                          <AIProductRecommendationCard
                            key={product.id}
                            onNavigate={onClose}
                            product={product}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
                        条件に合う商品が見つかりませんでした。ご予算や条件を変更して、もう一度お試しください。
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form
          className="shrink-0 border-t border-stone-200 bg-white px-4 py-4 sm:px-5 dark:border-stone-700 dark:bg-stone-900"
          onSubmit={submit}
        >
          <label className="sr-only" htmlFor="shopping-assistant-message">
            商品のご希望
          </label>
          <div className="rounded-3xl border border-stone-300 bg-white p-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/15 dark:border-stone-600 dark:bg-stone-950">
            <textarea
              aria-describedby={characterCount > 800 ? "assistant-character-count" : undefined}
              aria-invalid={inputTooLong}
              className="max-h-32 min-h-16 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-stone-950 outline-none placeholder:text-stone-400 dark:text-stone-50"
              id="shopping-assistant-message"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="欲しい商品やご予算を入力してください"
              rows={2}
              value={input}
            />
            <div className="flex items-center justify-between gap-3 px-2 pb-1">
              <div>
                {characterCount > 800 ? (
                  <p
                    className={`text-[11px] ${inputTooLong ? "text-red-600" : "text-stone-400"}`}
                    id="assistant-character-count"
                    role={inputTooLong ? "alert" : undefined}
                  >
                    {characterCount.toLocaleString("ja-JP")} / 1,000
                  </p>
                ) : (
                  <span />
                )}
              </div>
              <button
                aria-label="メッセージを送信"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-stone-950 text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-orange-600 dark:hover:bg-orange-500"
                disabled={!canSend}
                type="submit"
              >
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="m5 12 14-7-4 14-3-6-7-1Z" />
                  <path d="m12 13 7-8" />
                </svg>
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] leading-4 text-stone-400">
            Enterで送信 · Shift＋Enterで改行
          </p>
        </form>
      </div>
    </Modal>
  );
}
