import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export type ActivityLogRow = {
  id: string;
  staff_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  staff?: { display_name: string | null; login_id: string } | null;
  /** target_type=profile のとき、対象患者の表示用情報 */
  target_profile?: {
    display_name: string | null;
    real_name: string | null;
    ticket_number: string | null;
  } | null;
};

/**
 * GET /api/activity-logs
 * スタッフ操作ログ一覧を取得（管理画面用）
 * Query: limit (default 100, max 500), offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    );
    const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;

    const supabase = createSupabaseAdminClient();

    const { data: rows, error } = await supabase
      .from("activity_logs")
      .select(`
        id,
        staff_id,
        action,
        target_type,
        target_id,
        details,
        created_at
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching activity_logs:", error);
      return NextResponse.json(
        { error: "操作ログの取得に失敗しました" },
        { status: 500 }
      );
    }

    const logs = (rows ?? []) as ActivityLogRow[];

    // staff_id が存在するものだけ staff を取得
    const staffIds = [...new Set(logs.map((l) => l.staff_id).filter(Boolean))] as string[];
    let staffMap: Record<string, { display_name: string | null; login_id: string }> = {};

    if (staffIds.length > 0) {
      const { data: staffList } = await supabase
        .from("staff")
        .select("id, display_name, login_id")
        .in("id", staffIds);
      if (staffList) {
        staffMap = Object.fromEntries(
          staffList.map((s) => [s.id, { display_name: s.display_name, login_id: s.login_id }])
        );
      }
    }

    // target_type=profile の target_id から profiles を取得
    const profileTargetIds = [
      ...new Set(
        logs
          .filter((l) => l.target_type === "profile" && l.target_id)
          .map((l) => l.target_id as string)
      ),
    ];
    let profileMap: Record<
      string,
      { display_name: string | null; real_name: string | null; ticket_number: string | null }
    > = {};
    if (profileTargetIds.length > 0) {
      const { data: profileList } = await supabase
        .from("profiles")
        .select("id, display_name, real_name, ticket_number")
        .in("id", profileTargetIds);
      if (profileList) {
        profileMap = Object.fromEntries(
          profileList.map((p) => [
            p.id,
            {
              display_name: p.display_name ?? null,
              real_name: p.real_name ?? null,
              ticket_number: p.ticket_number ?? null,
            },
          ])
        );
      }
    }

    const items = logs.map((log) => ({
      ...log,
      staff:
        log.staff_id != null
          ? staffMap[log.staff_id] ?? null
          : null,
      target_profile:
        log.target_type === "profile" && log.target_id
          ? profileMap[log.target_id] ?? null
          : null,
    }));

    return NextResponse.json({ logs: items });
  } catch (err) {
    console.error("activity-logs API error:", err);
    return NextResponse.json(
      { error: "操作ログの取得に失敗しました" },
      { status: 500 }
    );
  }
}
