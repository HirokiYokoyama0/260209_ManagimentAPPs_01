import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import type { RewardExchangeWithDetails } from "@/lib/types";

/**
 * GET /api/reward-exchanges
 * 特典交換履歴の一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status"); // pending, completed, cancelled
    const search = searchParams.get("search")?.trim() || null; // 患者名、診察券番号、または特典名で検索

    const supabase = createSupabaseAdminClient();

    // 検索語がある場合、先に一致する user_id / reward_id を解決してDB側で絞り込む。
    // （旧実装は limit(50) の後にJS側で検索していたため、直近50件に入らない患者は
    //   診察券で検索してもヒットしなかった。検索を limit の前＝DBクエリ側に移す。）
    let matchedUserIds: string[] | null = null;
    let matchedRewardIds: string[] | null = null;
    if (search) {
      // PostgREST の or/in フィルタ構文を壊す文字を除去（診察券番号・氏名には不要）
      const safe = search.replace(/[,()%*\\"']/g, "");
      if (safe) {
        const { data: matchedProfiles } = await supabase
          .from("profiles")
          .select("id")
          .or(
            `display_name.ilike.%${safe}%,real_name.ilike.%${safe}%,ticket_number.ilike.%${safe}%`
          );
        matchedUserIds = (matchedProfiles || []).map((p) => p.id);

        const { data: matchedRewards } = await supabase
          .from("milestone_rewards")
          .select("id")
          .ilike("name", `%${safe}%`);
        matchedRewardIds = (matchedRewards || []).map((r) => r.id);
      } else {
        matchedUserIds = [];
        matchedRewardIds = [];
      }

      // 一致する患者・特典が無ければ即空返し（無駄なクエリを避ける）
      if (matchedUserIds.length === 0 && matchedRewardIds.length === 0) {
        return NextResponse.json({ exchanges: [] });
      }
    }

    // マイルストーン型特典の交換履歴を取得
    // 注: reward_exchanges.reward_id の外部キー制約は削除されているため、手動でJOINする
    let query = supabase
      .from("reward_exchanges")
      .select(`
        *,
        profiles:user_id (
          display_name,
          real_name,
          picture_url,
          ticket_number
        )
      `)
      .eq("is_milestone_based", true)
      .order("exchanged_at", { ascending: false })
      // 検索時は特定患者の全期間履歴が出るよう上限を広げる（無検索時は直近50件）
      .limit(search ? 500 : 50);

    // ステータスフィルタ
    if (status && (status === "available" || status === "pending" || status === "completed" || status === "cancelled" || status === "expired")) {
      query = query.eq("status", status);
    }

    // 検索フィルタ（DB側・limit前）: 患者一致 または 特典名一致
    if (search) {
      const orParts: string[] = [];
      if (matchedUserIds && matchedUserIds.length > 0) {
        orParts.push(`user_id.in.(${matchedUserIds.join(",")})`);
      }
      if (matchedRewardIds && matchedRewardIds.length > 0) {
        orParts.push(`reward_id.in.(${matchedRewardIds.join(",")})`);
      }
      if (orParts.length > 0) {
        query = query.or(orParts.join(","));
      }
    }

    const { data: exchanges, error } = await query;

    if (error) {
      console.error("Error fetching reward exchanges:", error);
      return NextResponse.json(
        { error: "特典交換履歴の取得に失敗しました" },
        { status: 500 }
      );
    }

    if (!exchanges) {
      return NextResponse.json({ exchanges: [] });
    }

    // milestone_rewards テーブルから特典情報を取得（手動JOIN用）
    const { data: milestoneRewards, error: rewardsError } = await supabase
      .from("milestone_rewards")
      .select("id, name, description, milestone_type");

    if (rewardsError) {
      console.error("Error fetching milestone rewards:", rewardsError);
      return NextResponse.json(
        { error: "特典情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    // reward_id から特典情報を引けるようにマップ化
    const rewardsMap = new Map(
      (milestoneRewards || []).map((r) => [r.id, r])
    );

    // データ整形（手動でJOIN）
    const formattedExchanges: RewardExchangeWithDetails[] = exchanges
      .map((ex: any) => {
        const reward = rewardsMap.get(ex.reward_id);
        return {
          id: ex.id,
          user_id: ex.user_id,
          user_name: ex.profiles?.display_name || "不明",
          user_real_name: ex.profiles?.real_name || null,
          user_picture_url: ex.profiles?.picture_url || null,
          user_medical_record_number: ex.profiles?.ticket_number || null,
          reward_id: ex.reward_id,
          reward_name: reward?.name || "不明な特典",
          reward_image_url: null, // milestone_rewardsにはimage_urlが存在しない
          stamp_count_used: ex.milestone_reached || ex.stamp_count_used, // milestone_reached を優先
          milestone_reached: ex.milestone_reached, // マイルストーン情報を追加
          is_milestone_based: ex.is_milestone_based,
          valid_until: ex.valid_until,
          is_first_time: ex.is_first_time,
          status: ex.status,
          exchanged_at: ex.exchanged_at,
          notes: ex.notes, // スタッフの操作履歴が記録される
          created_at: ex.created_at,
        };
      });

    return NextResponse.json({ exchanges: formattedExchanges });
  } catch (error) {
    console.error("Error in reward-exchanges API:", error);
    return NextResponse.json(
      { error: "特典交換履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
