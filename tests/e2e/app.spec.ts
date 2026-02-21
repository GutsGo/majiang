import { expect, test } from "@playwright/test";

test("desktop flow: explain answer persists to home stats", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "糊个铲铲" })).toBeVisible();

  await page.getByRole("link", { name: "进入讲解模式" }).click();
  await expect(page.getByRole("heading", { name: "讲解模式" })).toBeVisible();

  await page.locator(".option-item").first().click();
  await page.getByRole("button", { name: "提交并查看讲解" }).click();

  await page.getByRole("link", { name: "糊个铲铲" }).click();
  await expect(page.getByText("今日答题：1 题")).toBeVisible();
});

test("mobile flow: challenge result persists after reload and app works offline", async ({
  page,
  context,
}) => {
  await page.goto("/challenge");
  await page.getByRole("button", { name: /定缺换牌·第1关/ }).click();

  await page.locator(".option-item").first().click();
  await page.getByRole("button", { name: "锁定答案" }).click();

  await page.reload();
  await page.getByRole("link", { name: "错题" }).click();
  await expect(page.getByRole("heading", { name: "错题本复训" })).toBeVisible();

  await context.setOffline(true);
  await page.getByRole("link", { name: "口技" }).click();
  await expect(page.getByRole("heading", { name: "口技学习" })).toBeVisible();
});
