export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isHttpOrPublicAssetUrl(value: string): boolean {
  if (isHttpUrl(value)) return true;
  if (!/^\/[A-Za-z0-9._~/-]+$/.test(value) || value.startsWith("//")) return false;

  return value
    .split("/")
    .every(
      (segment, index) => index === 0 || (segment !== "" && segment !== "." && segment !== ".."),
    );
}

export function isNonNegativeSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}
