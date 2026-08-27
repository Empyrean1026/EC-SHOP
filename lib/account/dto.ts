import type { AccountAddress, AccountProfile } from "@/types/account";

type UnknownRecord = Record<string, unknown>;

function stringId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toString" in value) return String(value);
  return "";
}

export function toAccountAddress(source: unknown): AccountAddress | null {
  if (!source || typeof source !== "object") return null;
  const address = source as UnknownRecord;

  return {
    fullName: String(address.fullName ?? ""),
    phone: String(address.phone ?? ""),
    line1: String(address.line1 ?? ""),
    line2: String(address.line2 ?? ""),
    city: String(address.city ?? ""),
    state: String(address.state ?? ""),
    postalCode: String(address.postalCode ?? ""),
    country: String(address.country ?? ""),
  };
}

export function toAccountProfile(source: unknown): AccountProfile {
  const user = source as UnknownRecord;

  return {
    id: stringId(user._id),
    name: String(user.name),
    email: String(user.email),
    role: user.role === "admin" ? "admin" : "customer",
    avatar: typeof user.avatar === "string" ? user.avatar : null,
    address: toAccountAddress(user.address),
    createdAt: new Date(user.createdAt as string | number | Date).toISOString(),
    updatedAt: new Date(user.updatedAt as string | number | Date).toISOString(),
  };
}
