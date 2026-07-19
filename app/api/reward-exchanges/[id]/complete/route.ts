import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { verifySessionCookieServer } from "@/lib/simple-auth";
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

    // セッションからスタッフ情報を取得
    const allCookies = request.cookies.getAll();
    const sessionCookie = allCookies.find(c => c.name.startsWith('admin_session'));

    let completedBy = "管理者";
    let staffId: string | null = null;

    if (sessionCookie) {
      const session = verifySessionCookieServer(sessionCookie.value);
      if (session && session.staffId) {
        staffId = session.staffId;
        // スタッフ情報を取得
        const adminClient = createSupabaseAdminClient();
        const { data: staff } = await adminClient
          .from("staff")
          .select("display_name")
          .eq("id", session.staffId)
          .single();

        if (staff?.display_name) {
          completedBy = staff.display_name;
        }
      }
    }

    const supabase = createSupabaseAdminClient();

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

    // ステータスを completed に更新し、notesにスタッフ情報を記録
    const completedNote = `[${new Date().toISOString()}] ${completedBy} が引き渡し完了`;
    const updatedNotes = existingRecord.notes
      ? `${existingRecord.notes}\n${completedNote}`
      : completedNote;

    const { data: updatedData, error: updateError, count } = await supabase
      .from("reward_exchanges")
      .update({
        status: "completed",
        notes: updatedNotes,
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

    // 兄弟の未完了レコードを cancelled 化（Phase B・移行期の取り残し防止・fail-open）
    // 対象: 同一 (user_id, reward_id, milestone_reached) の status∈{available,pending}（当該id以外）。
    // ＝ 自動付与availableを残したまま特典交換pendingをcompleteした場合の重複を解消。
    // 失敗しても引き渡し完了自体は成功扱い（患者影響を出さない）。
    try {
      if (existingRecord.is_milestone_based && existingRecord.milestone_reached != null) {
        const { data: siblings } = await supabase
          .from("reward_exchanges")
          .select("id, notes")
          .eq("user_id", existingRecord.user_id)
          .eq("reward_id", existingRecord.reward_id)
          .eq("milestone_reached", existingRecord.milestone_reached)
          .neq("id", id)
          .in("status", ["available", "pending"]);

        for (const sib of siblings ?? []) {
          const dedupNote = `[${new Date().toISOString()}] 同一マイルストーンの重複のため自動キャンセル（id=${id} を引き渡し完了）`;
          await supabase
            .from("reward_exchanges")
            .update({
              status: "cancelled",
              notes: sib.notes ? `${sib.notes}\n${dedupNote}` : dedupNote,
            })
            .eq("id", sib.id);
        }

        if (siblings && siblings.length > 0) {
          console.log(
            `🧹 兄弟の重複特典を ${siblings.length}件 cancelled 化: user=${existingRecord.user_id} ms=${existingRecord.milestone_reached}`
          );
        }
      }
    } catch (dedupError) {
      // fail-open: dedup失敗でも引き渡し完了は成功として続行
      console.error("⚠️ 兄弟available/pendingのcancel処理に失敗（引き渡し完了自体は成功）:", dedupError);
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
