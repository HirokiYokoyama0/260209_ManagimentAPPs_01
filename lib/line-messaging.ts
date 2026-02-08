/**
 * LINE Messaging API（pushMessage）連携
 * .env.local に LINE_CHANNEL_ID, LINE_CHANNEL_SECRET を設定。
 * オプションで LINE_CHANNEL_ACCESS_TOKEN を設定するとそれを使用（未設定時は ID+Secret で短期トークン取得）。
 */

const LINE_API_BASE = "https://api.line.me";

async function getChannelAccessToken(): Promise<string | null> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (token?.trim()) return token.trim();

  // .env.local の Channel_ID / Channel_secret または LINE_* を利用
  const channelId =
    process.env.LINE_CHANNEL_ID?.trim() || process.env.Channel_ID?.trim();
  const channelSecret =
    process.env.LINE_CHANNEL_SECRET?.trim() || process.env.Channel_secret?.trim();
  if (!channelId || !channelSecret) return null;

  const res = await fetch(`${LINE_API_BASE}/v2/oauth/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: channelId.trim(),
      client_secret: channelSecret.trim(),
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

/**
 * プッシュメッセージを送信する。
 * @param toUserId LINE のユーザーID（profiles.id / line_user_id）
 * @param text 送信するテキスト
 * @returns 成功したら true、トークンなし・API エラー時は false
 */
export async function pushMessage(
  toUserId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const accessToken = await getChannelAccessToken();
  if (!accessToken) {
    return { ok: false, error: "LINE_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_ID/SECRET not configured" };
  }

  const res = await fetch(`${LINE_API_BASE}/v2/bot/message/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: toUserId,
      messages: [{ type: "text", text: text.slice(0, 5000) }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    return { ok: false, error: err.message ?? res.statusText };
  }
  return { ok: true };
}
