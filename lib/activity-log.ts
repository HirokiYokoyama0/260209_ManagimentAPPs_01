/**
 * スタッフ操作ログ（activity_logs）
 * 23_イベントログ設計（スタッフ操作ログ）.md に準拠
 */

import { getSessionCookieName, verifySessionCookieServer } from "@/lib/simple-auth";
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

export type LogAction =
  | "login"
  | "logout"
  | "profile_update"
  | "stamp_increment"
  | "stamp_set"
  | "message_send"
  | "broadcast_send"
  | "reward_exchange_complete"
  | "reward_exchange_cancel"
  | "reward_exchange_delete"
  | "family_create"
  | "family_update"
  | "family_delete"
  | "family_member_add"
  | "family_member_remove"
  | "staff_create"
  | "staff_update"
  | "staff_deactivate"
  | "survey_targets_distribute"
  | "survey_answer_reset";

export type LogActivityParams = {
  /** 操作したスタッフのID。null = 従来の環境変数ログイン（admin） */
  staffId: string | null;
  action: LogAction;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
};

/**
 * リクエストから staff_id を取得する。Cookie を検証。
 * スタッフテーブルでログインした場合は staff_id、従来の環境変数ログイン（admin）の場合は null。
 */
export function getStaffIdFromRequest(request: NextRequest): string | null {
  const cookieName = getSessionCookieName();
  const cookieValue = request.cookies.get(cookieName)?.value;
  const session = verifySessionCookieServer(cookieValue);
  return session?.staffId ?? null;
}

/**
 * activity_logs に 1 件 INSERT する。
 * 失敗しても業務処理は止めない（try/catch で握りつぶす）。
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: LogActivityParams
): Promise<void> {
  try {
    await supabase.from("activity_logs").insert({
      staff_id: params.staffId,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      details: params.details ?? null,
    });
  } catch {
    // 監査用のため、ログ記録失敗で業務を止めない
  }
}

/**
 * リクエストから staff_id を取得し、logActivity を呼ぶ。
 * staff_id が null（従来の admin ログイン）の場合も記録する。
 * supabase を渡さない場合は内部で createSupabaseAdminClient() を使用する。
 */
export async function logActivityIfStaff(
  request: NextRequest,
  action: LogAction,
  options: {
    targetType?: string | null;
    targetId?: string | null;
    details?: Record<string, unknown> | null;
    supabase?: SupabaseClient;
  } = {}
): Promise<void> {
  const staffId = getStaffIdFromRequest(request);

  const supabase = options.supabase ?? createSupabaseAdminClient();
  await logActivity(supabase, {
    staffId,
    action,
    targetType: options.targetType ?? null,
    targetId: options.targetId ?? null,
    details: options.details ?? null,
  });
}
