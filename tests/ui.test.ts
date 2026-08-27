import assert from "node:assert/strict";
import test from "node:test";
import { resolveThemePreference, THEME_STORAGE_KEY } from "@/lib/ui/theme";

test("theme resolution honors explicit choice and otherwise follows the operating system", () => {
  assert.equal(resolveThemePreference("dark", false), "dark");
  assert.equal(resolveThemePreference("light", true), "light");
  assert.equal(resolveThemePreference(null, true), "dark");
  assert.equal(resolveThemePreference(null, false), "light");
  assert.equal(resolveThemePreference("invalid", true), "dark");
  assert.equal(THEME_STORAGE_KEY, "ec-site-theme");
});
