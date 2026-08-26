import type { NextResponse } from "next/server";
import {
  CSRF_COOKIE_NAME,
  CSRF_DURATION_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth/constants";

const isProduction = process.env.NODE_ENV === "production";

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction,
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
    secure: isProduction,
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
    secure: isProduction,
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
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
}
