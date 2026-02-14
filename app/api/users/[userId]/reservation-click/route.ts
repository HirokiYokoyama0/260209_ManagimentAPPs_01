import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/users/[userId]/reservation-click
 * 予約ボタンのクリック数をカウントアップ
 *
 * LIFF側から呼び出され、該当ユーザーの reservation_button_clicks を +1 する
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // バリデーション: userIdが空でないか確認
    if (!userId || userId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "userIdが必要です" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Supabaseのストアドファンクションを呼び出してクリック数を+1
    // この関数は排他制御を含み、安全にカウントアップする
    const { error } = await supabase.rpc('increment_reservation_clicks', {
      p_user_id: userId
    });

    if (error) {
      console.error("予約クリックカウントエラー:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 成功
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("予約クリックAPI例外:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラー" },
      { status: 500 }
    );
  }
}
