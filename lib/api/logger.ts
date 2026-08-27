type ErrorLogContext = {
  requestId: string;
  context: string;
  error: unknown;
  metadata?: Record<string, string | number | boolean | null>;
};

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
      ...(error.cause ? { cause: String(error.cause) } : {}),
    };
  }

  return { name: "UnknownError", message: String(error) };
}

export function logServerError({ requestId, context, error, metadata }: ErrorLogContext) {
  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      requestId,
      context,
      ...serializeError(error),
      ...(metadata ? { metadata } : {}),
    }),
  );
}

export function logServerEvent(
  level: "info" | "warn",
  context: string,
  message: string,
  metadata?: Record<string, string | number | boolean | null>,
) {
  const output = JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    context,
    message,
    ...(metadata ? { metadata } : {}),
  });

  if (level === "warn") console.warn(output);
  else console.info(output);
}

export function createRequestId() {
  return crypto.randomUUID();
}
