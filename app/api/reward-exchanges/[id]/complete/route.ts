import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/reward-exchanges/[id]/complete
 * 特典の引き渡し完了処理
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { completedBy } = body;

    if (!completedBy) {
      return NextResponse.json(
        { error: "担当者名が必要です" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // まず、該当レコードが存在するか確認
    const { data: existingRecord, error: fetchError } = await supabase
      .from("reward_exchanges")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingRecord) {
      console.error("Record not found:", fetchError);
      return NextResponse.json(
        { error: "交換履歴が見つかりません" },
        { status: 404 }
      );
    }

    console.log("Found record:", existingRecord);

    // ステータスを completed に更新（テーブルにはstatusカラムのみ存在）
    const { data: updatedData, error: updateError, count } = await supabase
      .from("reward_exchanges")
      .update({
        status: "completed",
      })
      .eq("id", id)
      .select();

    console.log("Update result:", { updatedData, updateError, count });

    if (updateError) {
      console.error("Error completing reward exchange:", updateError);
      return NextResponse.json(
        { error: "引き渡し完了処理に失敗しました", details: updateError },
        { status: 500 }
      );
    }

    if (!updatedData || updatedData.length === 0) {
      console.error("No rows were updated");
      return NextResponse.json(
        { error: "更新されませんでした（RLSポリシーの問題の可能性があります）" },
        { status: 500 }
      );
    }

    await logActivityIfStaff(request, "reward_exchange_complete", {
      targetType: "reward_exchange",
      targetId: id,
    });

    return NextResponse.json({ success: true, data: updatedData[0] });
  } catch (error) {
    console.error("Error in complete API:", error);
    return NextResponse.json(
      { error: "引き渡し完了処理に失敗しました" },
      { status: 500 }
    );
  }
}
