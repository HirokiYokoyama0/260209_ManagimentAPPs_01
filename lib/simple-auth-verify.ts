/**
 * Edge（middleware）用: セッション Cookie の署名検証（Web Crypto のみ使用）
 */

const AUTH_SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";

export async function verifySessionCookie(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return false;
  const [prefix, expStr, sig] = parts;
  if (!prefix || prefix.length < 2) return false;
  const exp = parseInt(expStr, 10);
  if (Number.isNaN(exp) || exp < Date.now()) return false;

  const encoder = new TextEncoder();
  const payload = `${prefix}.${expStr}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  const expectedSig = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return sig === expectedSig;
}

/**
 * セッションCookie名を取得
 * @param deviceId デバイスID（オプション）
 * @returns Cookie名（デバイスIDがある場合は "admin_session_{deviceId}"、ない場合は "admin_session"）
 */
export function getSessionCookieName(deviceId?: string): string {
  if (deviceId && deviceId.trim() !== '') {
    return `admin_session_${deviceId}`;
  }
  return "admin_session"; // フォールバック（下位互換性）
}

/**
 * 複数のCookieの中から有効なセッションCookieを検証
 *
 * すべての admin_session_* および admin_session をチェックし、
 * いずれか1つでも有効なセッションがあれば true を返す。
 *
 * @param cookies Cookie名と値のMap
 * @returns いずれかのセッションが有効であれば true
 */
export async function verifyAnySessionCookie(cookies: Map<string, string>): Promise<boolean> {
  for (const [name, value] of cookies.entries()) {
    // admin_session または admin_session_{deviceId} の形式をチェック
    if (name === 'admin_session' || name.startsWith('admin_session_')) {
      if (await verifySessionCookie(value)) {
        return true;
      }
    }
  }
  return false;
}
