/**
 * Edge（middleware）用: セッション Cookie の署名検証（Web Crypto のみ使用）
 */

const AUTH_SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";

export async function verifySessionCookie(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return false;
  const [user, expStr, sig] = parts;
  if (user !== "admin") return false;
  const exp = parseInt(expStr, 10);
  if (Number.isNaN(exp) || exp < Date.now()) return false;

  const encoder = new TextEncoder();
  const payload = `${user}.${expStr}`;
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

export function getSessionCookieName(): string {
  return "admin_session";
}
