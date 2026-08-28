import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/jwt";
import { isRequestOriginAllowed } from "@/lib/security/cors";
import { buildContentSecurityPolicy, createCspNonce } from "@/lib/security/headers";
import {
  consumeRateLimit,
  getRateLimitIdentifier,
  policyForApiPath,
  setRateLimitHeaders,
} from "@/lib/security/rate-limit";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    if (!isRequestOriginAllowed(request)) {
      return apiError("CORS_ORIGIN_DENIED", "不允许跨站访问该 API。", 403);
    }

    const rateLimit = consumeRateLimit(
      await getRateLimitIdentifier(request),
      policyForApiPath(pathname),
    );

    if (!rateLimit.allowed) {
      const response = apiError("RATE_LIMITED", "请求过于频繁，请稍后重试。", 429);
      setRateLimitHeaders(response.headers, rateLimit);
      return response;
    }

    const response = NextResponse.next();
    setRateLimitHeaders(response.headers, rateLimit);
    return response;
  }

  const nonce = createCspNonce();
  const csp = buildContentSecurityPolicy(nonce, process.env.NODE_ENV === "development");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const protectedPath = pathname.startsWith("/account") || pathname.startsWith("/admin");
  const session = protectedPath
    ? await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
    : null;

  if (protectedPath && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  if (pathname.startsWith("/admin") && session?.role !== "admin") {
    const response = NextResponse.redirect(new URL("/forbidden", request.url));
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
