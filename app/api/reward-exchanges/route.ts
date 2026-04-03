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
    const search = searchParams.get("search"); // 患者名、診察券番号、または特典名で検索

    const supabase = createSupabaseAdminClient();

    // マイルストーン型特典の交換履歴を取得
    // 注: reward_exchanges.reward_id の外部キー制約は削除されているため、手動でJOINする
    let query = supabase
      .from("reward_exchanges")
      .select(`
        *,
        profiles:user_id (
          display_name,
          picture_url,
          ticket_number
        )
      `)
      .eq("is_milestone_based", true)
      .order("exchanged_at", { ascending: false })
      .limit(50);

    // ステータスフィルタ
    if (status && (status === "pending" || status === "completed" || status === "cancelled")) {
      query = query.eq("status", status);
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
      })
      .filter((ex: RewardExchangeWithDetails) => {
        // 検索フィルタ（患者名・診察券番号・特典名）
        if (search) {
          const searchLower = search.toLowerCase();
          const userName = (ex.user_name || "").toLowerCase();
          const rewardName = (ex.reward_name || "").toLowerCase();
          const ticketNumber = (ex.user_medical_record_number || "").toLowerCase();

          return (
            userName.includes(searchLower) ||
            rewardName.includes(searchLower) ||
            ticketNumber.includes(searchLower)
          );
        }
        return true;
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
