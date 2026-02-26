import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/surveys/targets/reset-answer
 * 回答済みを未回答に戻す（answered_at をクリアし、survey_answers を削除）
 *
 * Body: { surveyId: string, userId: string }
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();

  try {
    const body = await request.json();
    const { surveyId, userId } = body;

    if (!surveyId || !userId) {
      return NextResponse.json(
        { error: "surveyId と userId は必須です" },
        { status: 400 }
      );
    }

    const { data: target } = await supabase
      .from("survey_targets")
      .select("id, answered_at")
      .eq("survey_id", surveyId)
      .eq("user_id", userId)
      .single();

    if (!target) {
      return NextResponse.json(
        { error: "対象の配信レコードが見つかりません" },
        { status: 404 }
      );
    }

    if (!target.answered_at) {
      return NextResponse.json(
        { error: "すでに未回答です" },
        { status: 400 }
      );
    }

    await supabase
      .from("survey_answers")
      .delete()
      .eq("survey_id", surveyId)
      .eq("user_id", userId);

    const { error: updateError } = await supabase
      .from("survey_targets")
      .update({ answered_at: null, updated_at: new Date().toISOString() })
      .eq("survey_id", surveyId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("未回答に戻す更新エラー:", updateError);
      return NextResponse.json(
        { error: "未回答への戻しに失敗しました" },
        { status: 500 }
      );
    }

    await logActivityIfStaff(request, "survey_answer_reset", {
      targetType: "survey_target",
      targetId: `${surveyId}:${userId}`,
      details: { surveyId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("reset-answer 処理エラー:", e);
    return NextResponse.json(
      { error: "未回答への戻しに失敗しました" },
      { status: 500 }
    );
  }
}
