import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/surveys/[surveyId]
 * アンケートの更新（配信期間・公開状態・タイトル等）
 * Body: { title?, description?, reward_stamps?, is_active?, start_date?, end_date? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  const supabase = createSupabaseAdminClient();
  const { surveyId } = await params;

  if (!surveyId) {
    return NextResponse.json({ error: "surveyId が必要です" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      reward_stamps,
      is_active,
      start_date,
      end_date,
    } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) updates.title = String(title).trim();
    if (description !== undefined) updates.description = description === "" ? null : String(description).trim();
    if (reward_stamps !== undefined) updates.reward_stamps = Number(reward_stamps);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (start_date !== undefined) updates.start_date = start_date === "" ? null : start_date;
    if (end_date !== undefined) updates.end_date = end_date === "" ? null : end_date;

    const { data, error } = await supabase
      .from("surveys")
      .update(updates)
      .eq("id", surveyId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "アンケートが見つかりません" }, { status: 404 });
      }
      console.error("アンケート更新エラー:", error);
      return NextResponse.json(
        { error: "アンケートの更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("アンケート更新処理エラー:", e);
    return NextResponse.json(
      { error: "アンケートの更新に失敗しました" },
      { status: 500 }
    );
  }
}
