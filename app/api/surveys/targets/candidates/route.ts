import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/surveys/targets/candidates?ticket=xxx
 * 診察券番号でプロフィールを検索（個別選択時の候補表示用）
 * 返却: [{ id, ticket_number, real_name, display_name }]
 */
export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const ticket = searchParams.get("ticket")?.trim();

  if (!ticket || ticket.length === 0) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, ticket_number, real_name, display_name")
    .ilike("ticket_number", `%${ticket}%`)
    .limit(20);

  if (error) {
    console.error("診察券番号検索エラー:", error);
    return NextResponse.json(
      { error: "候補の取得に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}
