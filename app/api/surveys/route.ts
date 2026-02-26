import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/surveys
 * アンケート一覧取得（管理ダッシュボード用）
 * Phase 4: 配信対象数・回答率・LIFF表示を付与
 */
export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data: surveys, error } = await supabase
    .from("surveys")
    .select("id, title, description, reward_stamps, is_active, start_date, end_date, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("アンケート一覧取得エラー:", error);
    return NextResponse.json(
      { error: "アンケート一覧の取得に失敗しました" },
      { status: 500 }
    );
  }

  const list = surveys ?? [];
  if (list.length === 0) return NextResponse.json([]);

  const { data: targets } = await supabase
    .from("survey_targets")
    .select("survey_id, answered_at, show_on_liff_open");

  const statsBySurvey: Record<
    string,
    { targetCount: number; answeredCount: number; showOnLiffOpen: boolean }
  > = {};
  for (const s of list) {
    statsBySurvey[s.id] = { targetCount: 0, answeredCount: 0, showOnLiffOpen: false };
  }
  for (const t of targets ?? []) {
    if (!statsBySurvey[t.survey_id]) continue;
    statsBySurvey[t.survey_id].targetCount++;
    if (t.answered_at) statsBySurvey[t.survey_id].answeredCount++;
    if (t.show_on_liff_open) statsBySurvey[t.survey_id].showOnLiffOpen = true;
  }

  const result = list.map((s) => {
    const st = statsBySurvey[s.id];
    const targetCount = st?.targetCount ?? 0;
    const answeredCount = st?.answeredCount ?? 0;
    const answerRate = targetCount > 0 ? Math.round((answeredCount / targetCount) * 100) : 0;
    return {
      ...s,
      targetCount,
      answeredCount,
      answerRate,
      showOnLiffOpen: st?.showOnLiffOpen ?? false,
    };
  });

  return NextResponse.json(result);
}

/**
 * POST /api/surveys
 * アンケート新規作成（Phase 1: 固定質問形式）
 *
 * Body: { id, title, description?, reward_stamps?, is_active?, start_date?, end_date? }
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();

  try {
    const body = await request.json();
    const {
      id,
      title,
      description,
      reward_stamps = 3,
      is_active = true,
      start_date,
      end_date,
    } = body;

    if (!id || typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        { error: "id は必須です（例: satisfaction_2026Q1）" },
        { status: 400 }
      );
    }
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "title は必須です" },
        { status: 400 }
      );
    }

    const insert: Record<string, unknown> = {
      id: id.trim(),
      title: title.trim(),
      description: description?.trim() ?? null,
      reward_stamps: Number(reward_stamps) || 3,
      is_active: Boolean(is_active),
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("surveys")
      .insert(insert)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "このアンケートIDは既に使用されています" },
          { status: 409 }
        );
      }
      console.error("アンケート作成エラー:", error);
      return NextResponse.json(
        { error: "アンケートの作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("アンケート作成処理エラー:", e);
    return NextResponse.json(
      { error: "アンケートの作成に失敗しました" },
      { status: 500 }
    );
  }
}
