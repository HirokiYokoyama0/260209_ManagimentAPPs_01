import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { filterProfilesBySegment } from "@/lib/broadcast";
import type { BroadcastSegment, Profile } from "@/lib/types";

/**
 * POST /api/broadcast/preview
 * セグメント条件に基づく対象者のプレビューを取得
 */
export async function POST(request: NextRequest) {
  try {
    const segment: BroadcastSegment = await request.json();

    // Supabaseから全患者データを取得
    const supabase = await createSupabaseServerClient();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching profiles:", error);
      return NextResponse.json(
        { error: "患者データの取得に失敗しました" },
        { status: 500 }
      );
    }

    if (!profiles) {
      return NextResponse.json({
        count: 0,
        preview: [],
        estimatedCost: 0,
      });
    }

    // セグメント条件でフィルタリング
    const filteredProfiles = filterProfilesBySegment(profiles as Profile[], segment);

    // プレビュー（最初の10件）
    const preview = filteredProfiles.slice(0, 10);

    // 推定メッセージ通数
    const estimatedCost = filteredProfiles.length;

    return NextResponse.json({
      count: filteredProfiles.length,
      preview,
      estimatedCost,
    });
  } catch (error) {
    console.error("Error in broadcast preview:", error);
    return NextResponse.json(
      { error: "プレビューの取得に失敗しました" },
      { status: 500 }
    );
  }
}
