import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/surveys/targets/create
 * 配信対象者を登録（全員 / 条件フィルタ / 個別選択）
 *
 * Body: {
 *   surveyId: string,
 *   targetType: 'all' | 'filter' | 'manual',
 *   filterConditions?: { lastVisitDays?: number, minStamps?: number },
 *   manualUserIds?: string[],
 *   showOnLiffOpen: boolean
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();

  try {
    const body = await request.json();
    const {
      surveyId,
      targetType,
      filterConditions = {},
      manualUserIds = [],
      showOnLiffOpen,
    } = body;

    if (!surveyId || typeof surveyId !== "string") {
      return NextResponse.json(
        { error: "surveyId は必須です" },
        { status: 400 }
      );
    }
    if (!["all", "filter", "manual"].includes(targetType)) {
      return NextResponse.json(
        { error: "targetType は all / filter / manual のいずれかです" },
        { status: 400 }
      );
    }
    if (typeof showOnLiffOpen !== "boolean") {
      return NextResponse.json(
        { error: "showOnLiffOpen は boolean で指定してください" },
        { status: 400 }
      );
    }

    let targetUserIds: string[] = [];

    if (targetType === "all") {
      const { data: users } = await supabase
        .from("profiles")
        .select("id");
      targetUserIds = users?.map((u) => u.id) ?? [];
    } else if (targetType === "filter") {
      let query = supabase.from("profiles").select("id");

      const { lastVisitDays, minStamps } = filterConditions;
      if (lastVisitDays != null && Number(lastVisitDays) > 0) {
        const since = new Date(
          Date.now() - Number(lastVisitDays) * 24 * 60 * 60 * 1000
        ).toISOString();
        query = query.gte("last_visit_date", since);
      }
      if (minStamps != null && Number(minStamps) >= 0) {
        query = query.gte("stamp_count", Number(minStamps) * 10);
      }

      const { data: users } = await query;
      targetUserIds = users?.map((u) => u.id) ?? [];
    } else {
      targetUserIds = Array.isArray(manualUserIds)
        ? manualUserIds.filter((id): id is string => typeof id === "string")
        : [];
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        targetCount: 0,
        message: "対象者が0人です",
      });
    }

    const targets = targetUserIds.map((user_id) => ({
      user_id,
      survey_id: surveyId,
      show_on_liff_open: showOnLiffOpen,
    }));

    const { error } = await supabase
      .from("survey_targets")
      .upsert(targets, {
        onConflict: "user_id,survey_id",
      });

    if (error) {
      console.error("配信対象者登録エラー:", error);
      return NextResponse.json(
        { error: "配信対象者の登録に失敗しました" },
        { status: 500 }
      );
    }

    await logActivityIfStaff(request, "survey_targets_distribute", {
      targetType: "survey",
      targetId: surveyId,
      details: {
        surveyId,
        targetCount: targetUserIds.length,
        targetType,
        showOnLiffOpen,
      },
    });

    return NextResponse.json({
      success: true,
      targetCount: targetUserIds.length,
    });
  } catch (e) {
    console.error("配信対象者登録処理エラー:", e);
    return NextResponse.json(
      { error: "配信対象者の登録に失敗しました" },
      { status: 500 }
    );
  }
}
