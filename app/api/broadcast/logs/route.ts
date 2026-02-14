import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/broadcast/logs
 * 配信履歴を取得
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: logs, error } = await supabase
      .from("broadcast_logs")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(50); // 最新50件

    if (error) {
      console.error("Error fetching broadcast logs:", error);
      return NextResponse.json(
        { error: "配信履歴の取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error("Error in broadcast logs:", error);
    return NextResponse.json(
      { error: "配信履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
