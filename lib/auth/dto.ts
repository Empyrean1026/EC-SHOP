import type { UserRole } from "@/models";
import type { AuthUser } from "@/types/auth";

type AuthUserSource = {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
};

export function toAuthUser(source: AuthUserSource): AuthUser {
  return {
    id: source._id.toString(),
    name: source.name,
    email: source.email,
    role: source.role,
    avatar: source.avatar ?? null,
  };
}
