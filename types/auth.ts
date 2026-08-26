import type { UserRole } from "@/models";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
};

export type SessionClaims = {
  userId: string;
  role: UserRole;
  expiresAt: number;
};
