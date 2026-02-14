import type { Profile, BroadcastSegment } from "./types";

/**
 * セグメント条件に基づいて患者をフィルタリングする
 */
export function filterProfilesBySegment(
  profiles: Profile[],
  segment: BroadcastSegment
): Profile[] {
  return profiles.filter((profile) => {
    // スタンプ数によるフィルタ
    if (segment.stampCount) {
      const { min, max } = segment.stampCount;
      if (min !== undefined && profile.stamp_count < min) return false;
      if (max !== undefined && profile.stamp_count > max) return false;
    }

    // 最終来院日によるフィルタ
    if (segment.lastVisitDays) {
      const { min, max } = segment.lastVisitDays;
      if (!profile.last_visit_date) {
        // 最終来院日が未設定の場合は除外
        return false;
      }
      const lastVisitDate = new Date(profile.last_visit_date);
      const now = new Date();
      const daysSinceLastVisit = Math.floor(
        (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (min !== undefined && daysSinceLastVisit < min) return false;
      if (max !== undefined && daysSinceLastVisit > max) return false;
    }

    // 表示モードによるフィルタ
    if (segment.viewMode !== undefined) {
      if (segment.viewMode === null) {
        // 未設定のみ
        if (profile.view_mode !== null && profile.view_mode !== undefined)
          return false;
      } else {
        // adult または kids
        if (profile.view_mode !== segment.viewMode) return false;
      }
    }

    // 公式アカ友だちフラグによるフィルタ
    if (segment.isLineFriend !== undefined) {
      if (segment.isLineFriend) {
        // 友だち登録済みのみ
        if (profile.is_line_friend !== true) return false;
      } else {
        // 未登録のみ
        if (profile.is_line_friend === true) return false;
      }
    }

    return true;
  });
}

/**
 * メッセージ内の変数を置換する
 */
export function replaceMessageVariables(
  message: string,
  profile: Profile
): string {
  return message
    .replace(/{name}/g, profile.display_name || "お客様")
    .replace(/{stamp_count}/g, String(profile.stamp_count || 0))
    .replace(
      /{ticket_number}/g,
      profile.ticket_number || "未設定"
    );
}

/**
 * 配信禁止時間帯かチェック（21:00 - 9:00）
 */
export function isRestrictedTime(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 21 || hour < 9;
}

/**
 * LINE IDのリストを500人ずつに分割
 */
export function chunkLineIds(
  lineIds: string[],
  chunkSize: number = 500
): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < lineIds.length; i += chunkSize) {
    chunks.push(lineIds.slice(i, i + chunkSize));
  }
  return chunks;
}
