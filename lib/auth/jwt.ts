import { SignJWT, jwtVerify } from "jose";
import { USER_ROLES, type UserRole } from "@/models";
import type { SessionClaims } from "@/types/auth";
import { JWT_AUDIENCE, JWT_ISSUER, SESSION_DURATION_SECONDS } from "@/lib/auth/constants";

const textEncoder = new TextEncoder();

function getJwtKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || textEncoder.encode(secret).byteLength < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 bytes");
  }

  return textEncoder.encode(secret);
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.some((role) => role === value);
}

export async function signSessionToken(userId: string, role: UserRole): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtKey());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtKey(), {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      clockTolerance: 5,
    });

    if (!payload.sub || !payload.exp || !isUserRole(payload.role)) {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role,
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}
