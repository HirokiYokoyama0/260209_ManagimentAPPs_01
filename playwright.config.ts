// @ts-check
import { defineConfig, devices } from "@playwright/test";

// .env.local を読み込み（存在する場合）
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // .env をフォールバック

/**
 * Playwright 設定
 * 管理ダッシュボードの E2E テスト用
 *
 * 起動: npm run dev で localhost:3003 を起動してから
 * 実行: npx playwright test
 * UI:  npx playwright test --ui
 *
 * 環境変数（.env.local または PLAYWRIGHT_*）:
 * - BASE_URL: テスト対象 URL（デフォルト: http://localhost:3003）
 * - PLAYWRIGHT_TEST_USER: ログイン ID（未設定時は ADMIN_USER → admin）
 * - PLAYWRIGHT_TEST_PASSWORD: ログインパスワード（未設定時は ADMIN_PASSWORD → 1234）
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3003",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // CI では 1 プロジェクトに絞る想定
  ],
  // CI 時のみサーバーを自動起動（ビルド済みを想定）
  webServer: process.env.CI
    ? {
        command: "npx next start -p 3003",
        url: "http://localhost:3003",
        reuseExistingServer: false,
        timeout: 60_000,
      }
    : undefined,
});
