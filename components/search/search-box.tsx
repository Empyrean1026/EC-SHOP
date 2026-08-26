"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatProductPrice } from "@/lib/products/format";
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_HISTORY_LIMIT,
  SEARCH_HISTORY_STORAGE_KEY,
} from "@/lib/search/constants";
import type { ApiResponse } from "@/types/api";
import type { SearchSuggestionsResult } from "@/types/search";

type SearchBoxProps = {
  initialValue?: string;
  prominent?: boolean;
};

type SuggestionStatus = "idle" | "pending" | "loading" | "success" | "error";

function readSearchHistory(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY) ?? "[]");

    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length >= 2 && item.length <= 100)
      .slice(0, SEARCH_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function writeSearchHistory(query: string, currentHistory: string[]): string[] {
  const nextHistory = [
    query,
    ...currentHistory.filter((item) => item.toLocaleLowerCase() !== query.toLocaleLowerCase()),
  ].slice(0, SEARCH_HISTORY_LIMIT);

  try {
    localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  } catch {
    // Search remains usable when storage is blocked or full.
  }

  return nextHistory;
}

export function SearchBox({ initialValue = "", prominent = false }: SearchBoxProps) {
  const router = useRouter();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResult["items"]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [status, setStatus] = useState<SuggestionStatus>("idle");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const query = value.trim();
  const showHistory = query.length === 0 && history.length > 0;
  const showSuggestions = query.length >= 2;
  const optionCount = showHistory ? history.length : suggestions.length;
  const dropdownOpen =
    focused &&
    (showHistory ||
      (showSuggestions && ["pending", "loading", "success", "error"].includes(status)));

  useEffect(() => {
    if (query.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");

      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json()) as ApiResponse<SearchSuggestionsResult>;

        if (!response.ok || !payload.success) {
          throw new Error("Suggestion request failed");
        }

        setSuggestions(payload.data.items);
        setStatus("success");
        setActiveIndex(-1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
        setStatus("error");
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function loadHistory() {
    if (historyLoaded) return;
    setHistory(readSearchHistory());
    setHistoryLoaded(true);
  }

  function rememberAndNavigate(nextQuery: string) {
    const normalized = nextQuery.trim();
    if (normalized.length < 2) return;

    setHistory((current) => writeSearchHistory(normalized, current));
    setFocused(false);
    router.push(`/search?q=${encodeURIComponent(normalized)}`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    rememberAndNavigate(query);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setValue(nextValue);
    setActiveIndex(-1);

    if (nextValue.trim().length < 2) {
      setSuggestions([]);
      setStatus("idle");
    } else {
      setStatus("pending");
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!dropdownOpen || optionCount === 0) return;
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        if (current < 0) return direction > 0 ? 0 : optionCount - 1;
        return (current + direction + optionCount) % optionCount;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected =
        activeIndex >= 0
          ? showHistory
            ? history[activeIndex]
            : suggestions[activeIndex]?.name
          : query;
      if (selected) rememberAndNavigate(selected);
    }
  }

  function clearHistory() {
    try {
      localStorage.removeItem(SEARCH_HISTORY_STORAGE_KEY);
    } catch {
      // The in-memory history can still be cleared when storage is unavailable.
    }

    setHistory([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  return (
    <form className="relative" onSubmit={handleSubmit} role="search">
      <div
        className={`flex items-center gap-3 border bg-white shadow-sm transition focus-within:border-orange-600 focus-within:ring-4 focus-within:ring-orange-600/10 ${
          prominent
            ? "rounded-2xl border-stone-300 p-2 sm:rounded-full sm:pl-5"
            : "rounded-full border-stone-200 p-1 pl-4"
        }`}
      >
        <svg
          aria-hidden="true"
          className="size-5 shrink-0 text-stone-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
        <input
          ref={inputRef}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={dropdownOpen}
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent text-stone-950 outline-none placeholder:text-stone-400 ${
            prominent ? "h-11 text-base" : "h-9 text-sm"
          }`}
          onBlur={() => setFocused(false)}
          onChange={handleInputChange}
          onFocus={() => {
            loadHistory();
            setFocused(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="搜索商品名称、描述或分类"
          role="combobox"
          type="search"
          value={value}
        />
        <button
          className={`shrink-0 rounded-full bg-stone-950 font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${
            prominent ? "h-11 px-6 text-sm" : "h-9 px-4 text-xs"
          }`}
          type="submit"
        >
          搜索
        </button>
      </div>

      {dropdownOpen ? (
        <div className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-40 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15">
          {showHistory ? (
            <>
              <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-500 uppercase">
                  搜索历史
                </p>
                <button
                  className="text-xs text-stone-400 transition hover:text-orange-600"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={clearHistory}
                  type="button"
                >
                  清空
                </button>
              </div>
            </>
          ) : null}

          <div id={listboxId} role="listbox">
            {showHistory
              ? history.map((item, index) => (
                  <button
                    aria-selected={index === activeIndex}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                      index === activeIndex
                        ? "bg-orange-50 text-orange-700"
                        : "text-stone-700 hover:bg-stone-50"
                    }`}
                    id={`${listboxId}-option-${index}`}
                    key={item}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => rememberAndNavigate(item)}
                    role="option"
                    type="button"
                  >
                    <span aria-hidden="true" className="text-stone-400">
                      ↻
                    </span>
                    {item}
                  </button>
                ))
              : null}

            {showSuggestions && suggestions.length > 0
              ? suggestions.map((suggestion, index) => (
                  <button
                    aria-selected={index === activeIndex}
                    className={`flex w-full items-center justify-between gap-4 border-b border-stone-100 px-4 py-3 text-left transition last:border-0 ${
                      index === activeIndex ? "bg-orange-50" : "hover:bg-stone-50"
                    }`}
                    id={`${listboxId}-option-${index}`}
                    key={suggestion.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => rememberAndNavigate(suggestion.name)}
                    role="option"
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-stone-900">
                        {suggestion.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-stone-400">
                        {suggestion.categoryName ?? "未分类"} ·{" "}
                        {suggestion.stock > 0 ? "有库存" : "缺货"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-stone-600">
                      {formatProductPrice(suggestion.price, suggestion.currency)}
                    </span>
                  </button>
                ))
              : null}
          </div>

          {showSuggestions && (status === "pending" || status === "loading") ? (
            <p className="px-4 py-5 text-center text-xs text-stone-400" role="status">
              正在查找建议…
            </p>
          ) : null}
          {showSuggestions && status === "success" && suggestions.length === 0 ? (
            <p className="px-4 py-5 text-center text-xs text-stone-400" role="status">
              暂无建议，按 Enter 查看完整搜索结果
            </p>
          ) : null}
          {showSuggestions && status === "error" ? (
            <p className="px-4 py-5 text-center text-xs text-red-600" role="status">
              搜索建议暂时不可用，仍可按 Enter 搜索
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
