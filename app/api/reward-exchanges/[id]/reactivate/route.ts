import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { verifySessionCookieServer } from "@/lib/simple-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/reward-exchanges/[id]/reactivate
 * 期限切れの特典を有効（pending）に戻す
 *
 * リスク対策：
 * - スタッフの判断で期限を延長できる
 * - 操作履歴をnotesに記録
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { extendDays } = body; // 延長する日数（オプション）

    // セッションからスタッフ情報を取得
    const allCookies = request.cookies.getAll();
    const sessionCookie = allCookies.find(c => c.name.startsWith('admin_session'));

    let staffName = "管理者";
    let staffId: string | null = null;

    if (sessionCookie) {
      const session = verifySessionCookieServer(sessionCookie.value);
      if (session && session.staffId) {
        staffId = session.staffId;
        const adminClient = createSupabaseAdminClient();
        const { data: staff } = await adminClient
          .from("staff")
          .select("display_name")
          .eq("id", session.staffId)
          .single();

        if (staff?.display_name) {
          staffName = staff.display_name;
        }
      }
    }

    const supabase = createSupabaseAdminClient();

    // 該当レコードを取得
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

    // 有効期限の延長処理
    let newValidUntil = existingRecord.valid_until;
    if (extendDays && typeof extendDays === 'number' && extendDays > 0) {
      const currentValidUntil = new Date(existingRecord.valid_until || new Date());
      currentValidUntil.setDate(currentValidUntil.getDate() + extendDays);
      newValidUntil = currentValidUntil.toISOString();
    }

    // ステータスを pending に戻し、notesに操作履歴を記録
    const reactivateNote = extendDays
      ? `[${new Date().toISOString()}] ${staffName} が期限切れを解除し、有効期限を${extendDays}日延長`
      : `[${new Date().toISOString()}] ${staffName} が期限切れを解除`;

    const updatedNotes = existingRecord.notes
      ? `${existingRecord.notes}\n${reactivateNote}`
      : reactivateNote;

    const { data: updatedData, error: updateError } = await supabase
      .from("reward_exchanges")
      .update({
        status: "pending",
        valid_until: newValidUntil,
        notes: updatedNotes,
      })
      .eq("id", id)
      .select();

    if (updateError) {
      console.error("Error reactivating reward exchange:", updateError);
      return NextResponse.json(
        { error: "期限切れ解除処理に失敗しました", details: updateError },
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

    // アクティビティログに記録
    await logActivityIfStaff(request, "reward_exchange_reactivate", {
      targetType: "reward_exchange",
      targetId: id,
      details: {
        extendDays: extendDays || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedData[0],
      message: extendDays
        ? `期限切れを解除し、有効期限を${extendDays}日延長しました`
        : "期限切れを解除しました"
    });
  } catch (error) {
    console.error("Error in reactivate API:", error);
    return NextResponse.json(
      { error: "期限切れ解除処理に失敗しました" },
      { status: 500 }
    );
  }
}
