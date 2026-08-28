import { expect, test } from "@playwright/test";

test("ユーザーが画面から新規登録、ログアウト、再ログインできる", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("氏名").fill("UIテストユーザー");
  await page.getByLabel("メールアドレス").fill("ui.e2e@example.com");
  await page.getByLabel("パスワード", { exact: true }).fill("TestPass123");
  await page.getByLabel("パスワード（確認）").fill("TestPass123");
  await page.getByRole("button", { name: "アカウントを作成" }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "こんにちは、UIテストユーザー" })).toBeVisible();

  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("メールアドレス").fill("ui.e2e@example.com");
  await page.getByLabel("パスワード").fill("TestPass123");
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("button", { name: "ログアウト" })).toBeVisible();
});
