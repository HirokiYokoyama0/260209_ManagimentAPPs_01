import { createClient } from "@supabase/supabase-js";

/**
 * メッセージ送信（care_messages INSERT）専用。RLS で INSERT を制限しているため
 * service_role キーが必要。.env.local に SUPABASE_SERVICE_ROLE_KEY を設定すること。
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY を設定してください（care_messages への挿入に必要）。Supabase ダッシュボードの Settings → API で確認できます。"
    );
  }
  return createClient(url, serviceRoleKey);
}
