/**
 * 管理者の簡易認証
 * - スタッフテーブル（staff）でログインする場合はセッションに staff_id を含める
 * - 従来の環境変数（ADMIN_USER / ADMIN_PASSWORD）はスタッフ未登録時のフォールバック用
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

/**
 * サーバー用: 署名付きセッショントークンを作成
 * @param staffId スタッフの UUID。省略時は従来形式（admin.期限.署名）
 */
export function createSessionToken(staffId?: string): string {
  const crypto = require("crypto");
  const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const prefix = staffId ?? "admin";
  const payload = `${prefix}.${expiry}`;
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/**
 * サーバー（API Route）用: Cookie を検証し、ペイロード（staff_id または null）を返す
 */
export function verifySessionCookieServer(cookieValue: string | undefined): { staffId: string | null } | null {
  if (!cookieValue) return null;
  const crypto = require("crypto");
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return null;
  const [prefix, expStr, sig] = parts;
  const exp = parseInt(expStr, 10);
  if (Number.isNaN(exp) || exp < Date.now()) return null;
  const payload = `${prefix}.${expStr}`;
  const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  if (sig !== expectedSig) return null;
  const staffId = prefix && prefix !== "admin" ? prefix : null;
  return { staffId };
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
