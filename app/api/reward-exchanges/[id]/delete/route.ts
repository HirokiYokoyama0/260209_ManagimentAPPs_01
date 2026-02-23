import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/reward-exchanges/[id]/delete
 * 特典交換履歴の削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createSupabaseServerClient();

    // レコードを削除
    const { error } = await supabase
      .from("reward_exchanges")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting reward exchange:", error);
      return NextResponse.json(
        { error: "削除に失敗しました" },
        { status: 500 }
      );
    }

    await logActivityIfStaff(request, "reward_exchange_delete", {
      targetType: "reward_exchange",
      targetId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete API:", error);
    return NextResponse.json(
      { error: "削除に失敗しました" },
      { status: 500 }
    );
  }
}
