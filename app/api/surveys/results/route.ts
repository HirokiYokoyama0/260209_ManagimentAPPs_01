import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/surveys/results?surveyId=xxx
 * 結果集計（Q1分布・NPS・自由記述）
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

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const { data: q1Data } = await supabase
    .from("survey_answers")
    .select("q1_rating")
    .eq("survey_id", surveyId);

  q1Data?.forEach((row) => {
    if (row.q1_rating != null && row.q1_rating >= 1 && row.q1_rating <= 5) {
      ratingCounts[row.q1_rating as 1 | 2 | 3 | 4 | 5]++;
    }
  });

  const { data: q3Data } = await supabase
    .from("survey_answers")
    .select("q3_recommend")
    .eq("survey_id", surveyId);

  const promoters = q3Data?.filter((r) => r.q3_recommend != null && r.q3_recommend >= 9).length ?? 0;
  const detractors = q3Data?.filter((r) => r.q3_recommend != null && r.q3_recommend <= 6).length ?? 0;
  const total = q3Data?.length ?? 0;
  const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

  const { data: commentsData } = await supabase
    .from("survey_answers")
    .select("q2_comment, created_at, user_id")
    .eq("survey_id", surveyId)
    .not("q2_comment", "is", null)
    .order("created_at", { ascending: false });

  const comments =
    commentsData?.map((c) => ({
      q2_comment: c.q2_comment,
      created_at: c.created_at,
      user_id: c.user_id,
    })) ?? [];

  // 回答者ごとの結果一覧（ひとりひとり）
  const { data: listData } = await supabase
    .from("survey_answers")
    .select("user_id, q1_rating, q2_comment, q3_recommend, created_at")
    .eq("survey_id", surveyId)
    .order("created_at", { ascending: false });

  const listRows = listData ?? [];
  const userIds = [...new Set(listRows.map((r) => r.user_id))];
  let displayNameMap: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    profilesData?.forEach((p) => {
      displayNameMap[p.id] = p.display_name ?? null;
    });
  }

  const list = listRows.map((r) => ({
    user_id: r.user_id,
    display_name: displayNameMap[r.user_id] ?? null,
    q1_rating: r.q1_rating,
    q2_comment: r.q2_comment,
    q3_recommend: r.q3_recommend,
    created_at: r.created_at,
  }));

  return NextResponse.json({
    q1Distribution: ratingCounts,
    nps,
    comments,
    list,
  });
}
