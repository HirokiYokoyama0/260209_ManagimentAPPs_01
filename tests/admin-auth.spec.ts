import { test, expect } from "@playwright/test";

/**
 * 管理画面ログインテスト
 *
 * 認証情報は .env.local の ADMIN_USER / ADMIN_PASSWORD を参照。
 * または PLAYWRIGHT_TEST_USER / PLAYWRIGHT_TEST_PASSWORD で上書き可能。
 * 未設定時は admin / 1234（simple-auth のデフォルト）
 */
const TEST_USER =
  process.env.PLAYWRIGHT_TEST_USER ?? process.env.ADMIN_USER ?? "admin";
const TEST_PASSWORD =
  process.env.PLAYWRIGHT_TEST_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "1234";

test.describe("管理画面 認証", () => {
  test("ログインできるか", async ({ page }) => {
    // 1. ログイン画面へアクセス
    await page.goto("/admin/login");

    // 2. フォームに入力（username と password の両方）
    await page.getByLabel("ログイン").fill(TEST_USER);
    await page.getByLabel("パスワード").fill(TEST_PASSWORD);

    // 3. ログインボタンをクリック
    await page.getByRole("button", { name: "ログイン" }).click();

    // 4. 患者管理画面に遷移したか確認
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator("h1")).toContainText("患者管理");
  });

  test("不正なパスワードでログインできない", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByLabel("ログイン").fill(TEST_USER);
    await page.getByLabel("パスワード").fill("wrong-password");
    await page.getByRole("button", { name: "ログイン" }).click();

    // ログイン画面のまま、エラー表示
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByText("ログインまたはパスワードが正しくありません")).toBeVisible();
  });
});
