export function isDuplicateKeyError(error: unknown): error is { code: 11000 } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
