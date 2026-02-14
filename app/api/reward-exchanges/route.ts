import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

    const supabase = await createSupabaseServerClient();

    // JOINクエリで一覧取得
    let query = supabase
      .from("reward_exchanges")
      .select(`
        *,
        profiles:user_id (
          display_name,
          picture_url,
          ticket_number
        ),
        rewards:reward_id (
          name,
          image_url
        )
      `)
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

    // データ整形
    const formattedExchanges: RewardExchangeWithDetails[] = exchanges
      .map((ex: any) => ({
        id: ex.id,
        user_id: ex.user_id,
        user_name: ex.profiles?.display_name || "不明",
        user_picture_url: ex.profiles?.picture_url || null,
        user_medical_record_number: ex.profiles?.ticket_number || null,
        reward_id: ex.reward_id,
        reward_name: ex.rewards?.name || "不明",
        reward_image_url: ex.rewards?.image_url || null,
        stamp_count_used: ex.stamp_count_used,
        status: ex.status,
        exchanged_at: ex.exchanged_at,
        completed_at: ex.completed_at,
        completed_by: ex.completed_by,
        notes: ex.notes,
        created_at: ex.created_at,
      }))
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
