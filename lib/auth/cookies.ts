import type { NextResponse } from "next/server";
import {
  CSRF_COOKIE_NAME,
  CSRF_DURATION_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth/constants";

export function shouldUseSecureCookies(
  applicationUrl = process.env.APP_URL,
  nodeEnvironment = process.env.NODE_ENV,
): boolean {
  if (applicationUrl) {
    try {
      return new URL(applicationUrl).protocol === "https:";
    } catch {
      // Invalid production configuration should fail closed.
    }
  }

  return nodeEnvironment === "production";
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
    priority: "high",
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
}

export function setCsrfCookie(response: NextResponse, value: string): void {
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "strict",
    path: "/",
    maxAge: CSRF_DURATION_SECONDS,
    priority: "high",
  });
}

export function clearCsrfCookie(response: NextResponse): void {
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
}
