/**
 * 管理者の簡易認証（admin / 1234）
 * ログイン成功時に署名付き Cookie を発行し、middleware で検証する。
 */

const COOKIE_NAME = "admin_session";
const ADMIN_USER = process.env.ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? "1234";
const AUTH_SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";
const SESSION_DAYS = 7;

export function getAdminCredentials() {
  return { username: ADMIN_USER, password: ADMIN_PASS };
}

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

/** サーバー（API Route）用: 署名付きセッショントークンを作成（形式: admin.期限.署名） */
export function createSessionToken(): string {
  const crypto = require("crypto");
  const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `admin.${expiry}`;
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** サーバー（API Route）用: Cookie を設定したレスポンス用オプション */
export function getSessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}
