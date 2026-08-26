import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { toAuthUser } from "@/lib/auth/dto";
import { verifySessionToken } from "@/lib/auth/jwt";
import { UserModel, type UserRole } from "@/models";
import type { AuthUser } from "@/types/auth";

export type AuthenticationResult =
  | { authenticated: true; user: AuthUser }
  | {
      authenticated: false;
      status: 401 | 403;
      code: "UNAUTHENTICATED" | "FORBIDDEN";
      message: string;
    };

async function findCurrentUser(userId: string): Promise<AuthUser | null> {
  await connectToDatabase();

  const user = await UserModel.findById(userId).select("_id name email role avatar").lean();

  return user ? toAuthUser(user) : null;
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    return null;
  }

  return findCurrentUser(session.userId);
});

export async function requireUser(role?: UserRole): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (role && user.role !== role) {
    redirect("/forbidden");
  }

  return user;
}

export async function authenticateRequest(
  request: NextRequest,
  role?: UserRole,
): Promise<AuthenticationResult> {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    return {
      authenticated: false,
      status: 401,
      code: "UNAUTHENTICATED",
      message: "请先登录。",
    };
  }

  const user = await findCurrentUser(session.userId);

  if (!user) {
    return {
      authenticated: false,
      status: 401,
      code: "UNAUTHENTICATED",
      message: "请先登录。",
    };
  }

  if (role && user.role !== role) {
    return {
      authenticated: false,
      status: 403,
      code: "FORBIDDEN",
      message: "你没有权限访问该资源。",
    };
  }

  return { authenticated: true, user };
}
