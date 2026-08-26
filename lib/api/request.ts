const DEFAULT_MAX_JSON_BODY_BYTES = 10 * 1024;

export type JsonBodyResult =
  | { success: true; data: unknown }
  | {
      success: false;
      code: "UNSUPPORTED_MEDIA_TYPE" | "PAYLOAD_TOO_LARGE" | "INVALID_JSON";
      message: string;
      status: 400 | 413 | 415;
    };

export async function readJsonBody(
  request: Request,
  maxBytes = DEFAULT_MAX_JSON_BODY_BYTES,
): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();

  if (contentType !== "application/json") {
    return {
      success: false,
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "Content-Type must be application/json.",
      status: 415,
    };
  }

  const contentLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      success: false,
      code: "PAYLOAD_TOO_LARGE",
      message: "Request body is too large.",
      status: 413,
    };
  }

  try {
    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).byteLength > maxBytes) {
      return {
        success: false,
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large.",
        status: 413,
      };
    }

    return {
      success: true,
      data: JSON.parse(rawBody) as unknown,
    };
  } catch {
    return {
      success: false,
      code: "INVALID_JSON",
      message: "Request body must contain valid JSON.",
      status: 400,
    };
  }
}
