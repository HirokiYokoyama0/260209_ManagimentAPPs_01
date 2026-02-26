import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/surveys/targets/list?surveyId=xxx
 * 配信対象者一覧（回答状況付き）・回答率
 */
export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const surveyId = searchParams.get("surveyId");

  if (!surveyId) {
    return NextResponse.json(
      { error: "surveyId をクエリで指定してください" },
      { status: 400 }
    );
  }

  const { data: targets, error } = await supabase
    .from("survey_target_status")
    .select("*")
    .eq("survey_id", surveyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("配信対象者一覧取得エラー:", error);
    return NextResponse.json(
      { error: "配信対象者一覧の取得に失敗しました" },
      { status: 500 }
    );
  }

  const list = targets ?? [];
  const totalCount = list.length;
  const answeredCount = list.filter((t) => t.answered_at != null).length;
  const answerRate =
    totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return NextResponse.json({
    targets: list,
    stats: {
      totalCount,
      answeredCount,
      unansweredCount: totalCount - answeredCount,
      answerRate,
    },
  });
}
