import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/surveys/[surveyId]/results/csv
 * アンケート結果をCSVでダウンロード
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ surveyId: string }> }
) {
  const { surveyId } = await context.params;
  const supabase = createSupabaseAdminClient();

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

  const escape = (v: string | null | undefined): string => {
    if (v == null) return "";
    const s = String(v);
    return '"' + s.replace(/"/g, '""') + '"';
  };

  const header = "回答日時,ユーザーID,表示名,Q1満足度,Q2自由記述,Q3推奨度";
  const rows = listRows.map((r) => {
    const createdAt = r.created_at
      ? new Date(r.created_at).toLocaleString("ja-JP")
      : "";
    return [
      escape(createdAt),
      escape(r.user_id),
      escape(displayNameMap[r.user_id] ?? ""),
      r.q1_rating != null ? String(r.q1_rating) : "",
      escape(r.q2_comment ?? ""),
      r.q3_recommend != null ? String(r.q3_recommend) : "",
    ].join(",");
  });

  const body = "\uFEFF" + header + "\n" + rows.join("\n");
  const filename = `survey_results_${surveyId}_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
