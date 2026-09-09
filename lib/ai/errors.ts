export type AIProviderErrorCategory =
  | "configuration"
  | "authentication"
  | "rate_limit"
  | "timeout"
  | "network"
  | "upstream"
  | "empty_response"
  | "invalid_response"
  | "invalid_json"
  | "unexpected";

export class AIProviderError extends Error {
  constructor(
    public readonly category: AIProviderErrorCategory,
    public readonly httpStatus?: number,
  ) {
    super("AI provider request failed");
    this.name = "AIProviderError";
  }
}

export class AIOutputValidationError extends Error {
  constructor(public readonly stage: "intent" | "recommendation") {
    super("AI provider returned an invalid structured response");
    this.name = "AIOutputValidationError";
  }
}

export function isAIServiceError(
  error: unknown,
): error is AIProviderError | AIOutputValidationError {
  return error instanceof AIProviderError || error instanceof AIOutputValidationError;
}
