import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/surveys/targets/update-liff
 * 指定アンケートの全配信対象の「LIFFアプリ初期表示」を一括更新
 * Body: { surveyId: string, showOnLiffOpen: boolean }
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();

  try {
    const body = await request.json();
    const { surveyId, showOnLiffOpen } = body;

    if (!surveyId) {
      return NextResponse.json(
        { error: "surveyId は必須です" },
        { status: 400 }
      );
    }
    if (typeof showOnLiffOpen !== "boolean") {
      return NextResponse.json(
        { error: "showOnLiffOpen は boolean で指定してください" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("survey_targets")
      .update({
        show_on_liff_open: showOnLiffOpen,
        updated_at: new Date().toISOString(),
      })
      .eq("survey_id", surveyId)
      .select("id");

    if (error) {
      console.error("LIFF表示一括更新エラー:", error);
      return NextResponse.json(
        { error: "LIFF表示の更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: data?.length ?? 0,
    });
  } catch (e) {
    console.error("update-liff 処理エラー:", e);
    return NextResponse.json(
      { error: "LIFF表示の更新に失敗しました" },
      { status: 500 }
    );
  }
}
