import { expect, test } from "@playwright/test";

test("用户可通过页面完成注册、退出和重新登录", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("姓名").fill("UI 测试用户");
  await page.getByLabel("邮箱").fill("ui.e2e@example.com");
  await page.getByLabel("密码", { exact: true }).fill("TestPass123");
  await page.getByLabel("确认密码").fill("TestPass123");
  await page.getByRole("button", { name: "创建账户" }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "你好，UI 测试用户" })).toBeVisible();

  await page.getByRole("button", { name: "退出登录" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("邮箱").fill("ui.e2e@example.com");
  await page.getByLabel("密码").fill("TestPass123");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("button", { name: "退出登录" })).toBeVisible();
});
