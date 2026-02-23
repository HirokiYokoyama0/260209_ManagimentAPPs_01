import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/reward-exchanges/[id]/cancel
 * 特典交換のキャンセル処理（スタンプは返却しない・積み上げ式）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

    const supabase = await createSupabaseServerClient();

    // 交換履歴を取得
    const { data: exchange, error: fetchError } = await supabase
      .from("reward_exchanges")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !exchange) {
      return NextResponse.json(
        { error: "交換履歴が見つかりません" },
        { status: 404 }
      );
    }

    // すでにキャンセル済みの場合
    if (exchange.status === "cancelled") {
      return NextResponse.json(
        { error: "すでにキャンセル済みです" },
        { status: 400 }
      );
    }

    // 交換履歴をキャンセル状態に更新（スタンプは返却しない）
    const { error: updateError } = await supabase
      .from("reward_exchanges")
      .update({
        status: "cancelled",
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating exchange status:", updateError);
      return NextResponse.json(
        { error: "キャンセル処理に失敗しました" },
        { status: 500 }
      );
    }

    await logActivityIfStaff(request, "reward_exchange_cancel", {
      targetType: "reward_exchange",
      targetId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in cancel API:", error);
    return NextResponse.json(
      { error: "キャンセル処理に失敗しました" },
      { status: 500 }
    );
  }
}
