import { base64url } from "jose";
import type { NextRequest } from "next/server";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/auth/constants";

const textEncoder = new TextEncoder();

async function getCsrfKey(): Promise<CryptoKey> {
  const secret = process.env.CSRF_SECRET;

  if (!secret || textEncoder.encode(secret).byteLength < 32) {
    throw new Error("CSRF_SECRET must contain at least 32 bytes");
  }

  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signCsrfToken(token: string): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", await getCsrfKey(), textEncoder.encode(token));

  return base64url.encode(new Uint8Array(signature));
}

export async function createCsrfToken(): Promise<{ token: string; cookieValue: string }> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = base64url.encode(randomBytes);
  const signature = await signCsrfToken(token);

  return {
    token,
    cookieValue: `${token}.${signature}`,
  };
}

export async function verifyCsrfToken(
  cookieValue: string | undefined,
  requestToken: string | null,
): Promise<boolean> {
  if (!cookieValue || !requestToken || requestToken.length > 256) {
    return false;
  }

  const separator = cookieValue.lastIndexOf(".");

  if (separator < 1) {
    return false;
  }

  const cookieToken = cookieValue.slice(0, separator);
  const encodedSignature = cookieValue.slice(separator + 1);

  if (cookieToken !== requestToken || !encodedSignature) {
    return false;
  }

  try {
    const signature = Uint8Array.from(base64url.decode(encodedSignature));

    return crypto.subtle.verify(
      "HMAC",
      await getCsrfKey(),
      signature,
      textEncoder.encode(requestToken),
    );
  } catch {
    return false;
  }
}

function hasTrustedOrigin(request: NextRequest): boolean {
  const configuredUrl = process.env.APP_URL;

  if (!configuredUrl) {
    return false;
  }

  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  try {
    const expectedOrigin = new URL(configuredUrl).origin;
    return origin === expectedOrigin && fetchSite !== "cross-site";
  } catch {
    return false;
  }
}

export async function validateCsrfRequest(request: NextRequest): Promise<boolean> {
  if (!hasTrustedOrigin(request)) {
    return false;
  }

  return verifyCsrfToken(
    request.cookies.get(CSRF_COOKIE_NAME)?.value,
    request.headers.get(CSRF_HEADER_NAME),
  );
}
