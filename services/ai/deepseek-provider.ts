import "server-only";

import {
  createDeepSeekProvider,
  DEFAULT_DEEPSEEK_BASE_URL,
  DEFAULT_DEEPSEEK_MODEL,
} from "@/lib/ai/deepseek-provider";
import { logServerEvent } from "@/lib/api/logger";
import type { AIProvider } from "@/lib/ai/provider";

export function createConfiguredDeepSeekProvider(): AIProvider {
  return createDeepSeekProvider({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL,
    model: process.env.DEEPSEEK_MODEL ?? DEFAULT_DEEPSEEK_MODEL,
    onTelemetry(event) {
      logServerEvent(
        event.outcome === "success" ? "info" : "warn",
        `ai.deepseek.${event.phase}`,
        event.outcome === "success" ? "Provider request completed." : "Provider request failed.",
        {
          requestId: event.requestId,
          provider: event.provider,
          model: event.model,
          latencyMs: event.latencyMs,
          retryCount: event.retryCount,
          ...(event.errorCategory ? { errorCategory: event.errorCategory } : {}),
          ...(event.httpStatus ? { httpStatus: event.httpStatus } : {}),
        },
      );
    },
  });
}
