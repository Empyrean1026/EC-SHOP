"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ShoppingAssistantErrorBoundaryProps = {
  children: ReactNode;
};

type ShoppingAssistantErrorBoundaryState = {
  failed: boolean;
};

export class ShoppingAssistantErrorBoundary extends Component<
  ShoppingAssistantErrorBoundaryProps,
  ShoppingAssistantErrorBoundaryState
> {
  state: ShoppingAssistantErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ShoppingAssistantErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Shopping Assistant UI failed", error, errorInfo);
  }

  render() {
    if (this.state.failed) {
      return (
        <button
          aria-label="AIショッピングアシスタントを再読み込み"
          className="fixed right-5 bottom-5 z-40 rounded-full border border-stone-300 bg-white px-4 py-3 text-xs font-semibold text-stone-700 shadow-lg transition hover:border-stone-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
          onClick={() => this.setState({ failed: false })}
          type="button"
        >
          AIを再読み込み
        </button>
      );
    }

    return this.props.children;
  }
}
