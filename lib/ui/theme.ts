export const THEME_STORAGE_KEY = "ec-site-theme";

export type ResolvedTheme = "light" | "dark";

export function resolveThemePreference(
  savedPreference: string | null,
  prefersDark: boolean,
): ResolvedTheme {
  if (savedPreference === "dark") return "dark";
  if (savedPreference === "light") return "light";
  return prefersDark ? "dark" : "light";
}
