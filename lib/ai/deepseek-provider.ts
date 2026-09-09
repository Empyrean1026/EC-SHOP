import { z } from "zod";
import { AIProviderError, type AIProviderErrorCategory } from "@/lib/ai/errors";
import type {
  AIProvider,
  AIProviderTelemetry,
  ProductRecommendationProviderInput,
  ShoppingIntentProviderInput,
} from "@/lib/ai/provider";
import {
  buildShoppingIntentSystemPrompt,
  buildShoppingRecommendationSystemPrompt,
  buildShoppingRecommendationUserMessage,
} from "@/lib/ai/shopping-prompts";

export const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
export const DEEPSEEK_TIMEOUT_MS = 15_000;
export const DEEPSEEK_MAX_RETRIES = 1;

const INTENT_MAX_TOKENS = 500;
const RECOMMENDATION_MAX_TOKENS = 800;
const deepSeekResponseSchema = z
  .object({
    choices: z
      .array(
        z
          .object({
            finish_reason: z.string().nullable().optional(),
            message: z
              .object({
                content: z.string().nullable(),
              })
              .passthrough(),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();

type ProviderFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export type DeepSeekProviderOptions = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetchImplementation?: ProviderFetch;
  onTelemetry?: (event: AIProviderTelemetry) => void;
};

type JsonRequest = {
  phase: "intent" | "recommendation";
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
};

function categoryForHttpStatus(status: number): AIProviderErrorCategory {
  if (status === 401 || status === 403) return "authentication";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "upstream";
  return "invalid_response";
}

function shouldRetry(error: AIProviderError): boolean {
  return ["timeout", "network", "upstream", "empty_response"].includes(error.category);
}

function safeBaseUrl(value: string): string {
  try {
    const url = new URL(value);

    if (!(["http:", "https:"] as string[]).includes(url.protocol)) {
      throw new Error("unsupported protocol");
    }

    return value.replace(/\/+$/, "");
  } catch {
    throw new AIProviderError("configuration");
  }
}

export function createDeepSeekProvider(options: DeepSeekProviderOptions): AIProvider {
  const apiKey = options.apiKey?.trim();

  if (!apiKey) {
    throw new AIProviderError("configuration");
  }

  const baseUrl = safeBaseUrl(options.baseUrl ?? DEFAULT_DEEPSEEK_BASE_URL);
  const model = options.model?.trim() || DEFAULT_DEEPSEEK_MODEL;
  const timeoutMs = options.timeoutMs ?? DEEPSEEK_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEEPSEEK_MAX_RETRIES;
  const fetchImplementation = options.fetchImplementation ?? fetch;

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
    throw new AIProviderError("configuration");
  }

  if (!Number.isSafeInteger(maxRetries) || maxRetries < 0 || maxRetries > 1) {
    throw new AIProviderError("configuration");
  }

  async function requestJson(request: JsonRequest): Promise<unknown> {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    let lastError = new AIProviderError("unexpected");

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      try {
        const response = await fetchImplementation(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: request.systemPrompt },
              { role: "user", content: request.userMessage },
            ],
            response_format: { type: "json_object" },
            thinking: { type: "disabled" },
            temperature: 0.1,
            max_tokens: request.maxTokens,
            stream: false,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new AIProviderError(categoryForHttpStatus(response.status), response.status);
        }

        let responseBody: unknown;

        try {
          responseBody = await response.json();
        } catch {
          throw new AIProviderError("invalid_response");
        }

        const envelope = deepSeekResponseSchema.safeParse(responseBody);

        if (!envelope.success) {
          throw new AIProviderError("invalid_response");
        }

        const choice = envelope.data.choices[0];

        if (!choice || choice.finish_reason === "length") {
          throw new AIProviderError("invalid_response");
        }

        const content = choice.message.content?.trim();

        if (!content) {
          throw new AIProviderError("empty_response");
        }

        let parsedContent: unknown;

        try {
          parsedContent = JSON.parse(content);
        } catch {
          throw new AIProviderError("invalid_json");
        }

        options.onTelemetry?.({
          requestId,
          provider: "deepseek",
          model,
          phase: request.phase,
          latencyMs: Date.now() - startedAt,
          retryCount: attempt,
          outcome: "success",
        });

        return parsedContent;
      } catch (error) {
        if (error instanceof AIProviderError) {
          lastError = error;
        } else if (timedOut) {
          lastError = new AIProviderError("timeout");
        } else if (
          error instanceof TypeError ||
          (error instanceof DOMException && error.name === "NetworkError")
        ) {
          lastError = new AIProviderError("network");
        } else {
          lastError = new AIProviderError("unexpected");
        }
      } finally {
        clearTimeout(timeout);
      }

      if (attempt >= maxRetries || !shouldRetry(lastError)) {
        options.onTelemetry?.({
          requestId,
          provider: "deepseek",
          model,
          phase: request.phase,
          latencyMs: Date.now() - startedAt,
          retryCount: attempt,
          outcome: "failure",
          errorCategory: lastError.category,
          httpStatus: lastError.httpStatus,
        });
        throw lastError;
      }
    }

    throw lastError;
  }

  return {
    extractShoppingIntent(input: ShoppingIntentProviderInput) {
      return requestJson({
        phase: "intent",
        systemPrompt: buildShoppingIntentSystemPrompt(input.allowedCategories),
        userMessage: input.message,
        maxTokens: INTENT_MAX_TOKENS,
      });
    },
    generateProductRecommendation(input: ProductRecommendationProviderInput) {
      return requestJson({
        phase: "recommendation",
        systemPrompt: buildShoppingRecommendationSystemPrompt(input.maxRecommendations),
        userMessage: buildShoppingRecommendationUserMessage(input.message, input.candidateProducts),
        maxTokens: RECOMMENDATION_MAX_TOKENS,
      });
    },
  };
}
