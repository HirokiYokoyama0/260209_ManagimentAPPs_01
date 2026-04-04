import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

export type StaffWithLastLogin = {
  id: string;
  login_id: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

/**
 * GET /api/admin/staff
 * スタッフアカウント一覧を取得（管理画面用）
 * 各スタッフの最終ログイン時刻も含む
 */
export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    // スタッフ一覧を取得
    const { data: staffList, error: staffError } = await supabase
      .from("staff")
      .select("id, login_id, display_name, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (staffError) {
      console.error("Error fetching staff:", staffError);
      return NextResponse.json(
        { error: "スタッフ一覧の取得に失敗しました" },
        { status: 500 }
      );
    }

    const staff = staffList ?? [];

    // 各スタッフの最終ログイン時刻を取得
    const staffIds = staff.map((s) => s.id);
    const staffWithLastLogin: StaffWithLastLogin[] = [];

    for (const s of staff) {
      // 各スタッフの最新のログインログを取得
      const { data: lastLoginLog } = await supabase
        .from("activity_logs")
        .select("created_at")
        .eq("staff_id", s.id)
        .eq("action", "login")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      staffWithLastLogin.push({
        ...s,
        last_login_at: lastLoginLog?.created_at ?? null,
      });
    }

    return NextResponse.json({ staff: staffWithLastLogin });
  } catch (err) {
    console.error("staff API error:", err);
    return NextResponse.json(
      { error: "スタッフ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
