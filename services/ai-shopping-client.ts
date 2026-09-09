import { parseApiResponse } from "@/services/api-client";
import type { AIRecommendedProduct, AIShoppingResponse } from "@/types/ai";

export const AI_SHOPPING_MESSAGE_MAX_LENGTH = 1000;

export type AIShoppingClientErrorKind =
  | "validation"
  | "rate_limit"
  | "authentication"
  | "unavailable"
  | "invalid_response"
  | "network"
  | "aborted"
  | "unknown";

export type AIShoppingClientResult =
  | { success: true; data: AIShoppingResponse }
  | {
      success: false;
      error: {
        kind: AIShoppingClientErrorKind;
        code: string;
      };
    };

const supportedCurrencies = new Set(["jpy", "usd", "cny"]);
const productSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const objectIdPattern = /^[a-f\d]{24}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoundedText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

function isSafeImage(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string" || value.length > 2048) return false;

  if (value.startsWith("/")) {
    return (
      value.startsWith("/products/") &&
      !value.includes("..") &&
      !value.includes("\\") &&
      !value.includes("?") &&
      !value.includes("#")
    );
  }

  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isSafeProductUrl(value: unknown, slug: string): value is string {
  return typeof value === "string" && value === `/products/${encodeURIComponent(slug)}`;
}

function isCategory(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;

  return (
    isBoundedText(value.name, 120) &&
    typeof value.slug === "string" &&
    productSlugPattern.test(value.slug)
  );
}

function isRecommendedProduct(value: unknown): value is AIRecommendedProduct {
  if (!isRecord(value)) return false;

  const slug = value.slug;

  return (
    typeof value.id === "string" &&
    objectIdPattern.test(value.id) &&
    isBoundedText(value.name, 200) &&
    typeof slug === "string" &&
    productSlugPattern.test(slug) &&
    typeof value.description === "string" &&
    value.description.length <= 5000 &&
    isCategory(value.category) &&
    typeof value.price === "number" &&
    Number.isSafeInteger(value.price) &&
    value.price >= 0 &&
    typeof value.currency === "string" &&
    supportedCurrencies.has(value.currency) &&
    typeof value.stock === "number" &&
    Number.isSafeInteger(value.stock) &&
    value.stock >= 0 &&
    isSafeImage(value.image) &&
    isSafeProductUrl(value.url, slug) &&
    isBoundedText(value.recommendationReason, 300)
  );
}

export function parseAIShoppingResponse(value: unknown): AIShoppingResponse | null {
  if (!isRecord(value) || !isBoundedText(value.message, 300) || !Array.isArray(value.products)) {
    return null;
  }

  if (value.products.length > 3 || !value.products.every(isRecommendedProduct)) {
    return null;
  }

  return {
    message: value.message,
    products: value.products,
  };
}

function failure(kind: AIShoppingClientErrorKind, code: string): AIShoppingClientResult {
  return { success: false, error: { kind, code } };
}

function classifyFailure(status: number, code: string): AIShoppingClientErrorKind {
  if (status === 429 || code === "RATE_LIMITED") return "rate_limit";
  if (status === 401 || status === 403) return "authentication";
  if (status === 503 || code === "AI_PROVIDER_UNAVAILABLE" || status >= 500) {
    return "unavailable";
  }
  if (code === "INVALID_RESPONSE" || code === "REQUEST_FAILED") return "invalid_response";
  return "unknown";
}

export function getAIShoppingErrorMessage(kind: AIShoppingClientErrorKind): string {
  switch (kind) {
    case "validation":
      return "メッセージは1,000文字以内で入力してください。";
    case "rate_limit":
      return "リクエストが多すぎます。少し時間をおいてからもう一度お試しください。";
    case "authentication":
      return "セキュリティ確認に失敗しました。ページを再読み込みしてもう一度お試しください。";
    case "unavailable":
      return "AIアシスタントへの接続に失敗しました。しばらくしてからもう一度お試しください。";
    case "invalid_response":
      return "商品情報を正しく読み取れませんでした。もう一度お試しください。";
    case "network":
      return "通信エラーが発生しました。接続を確認してもう一度お試しください。";
    case "aborted":
      return "";
    default:
      return "商品をご提案できませんでした。しばらくしてからもう一度お試しください。";
  }
}

export async function requestAIShopping(
  message: string,
  signal?: AbortSignal,
): Promise<AIShoppingClientResult> {
  const normalizedMessage = message.trim();

  if (normalizedMessage.length === 0 || normalizedMessage.length > AI_SHOPPING_MESSAGE_MAX_LENGTH) {
    return failure("validation", "VALIDATION_ERROR");
  }

  try {
    const response = await fetch("/api/ai/shopping", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: normalizedMessage }),
      signal,
    });
    const parsed = await parseApiResponse<unknown>(
      response,
      "AIアシスタントから正しい応答を受け取れませんでした。",
    );

    if (!parsed.success) {
      return failure(classifyFailure(response.status, parsed.error.code), parsed.error.code);
    }

    const data = parseAIShoppingResponse(parsed.data);
    return data ? { success: true, data } : failure("invalid_response", "INVALID_RESPONSE");
  } catch (error) {
    if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
      return failure("aborted", "REQUEST_ABORTED");
    }

    return failure("network", "NETWORK_ERROR");
  }
}
