import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export type EventLogRow = {
  id: string;
  user_id: string | null;
  event_name: string;
  source: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profile?: {
    display_name: string | null;
    real_name: string | null;
    ticket_number: string | null;
  } | null;
};

/**
 * GET /api/event-logs
 * ユーザー行動ログ一覧を取得（管理画面用）
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
      .from("event_logs")
      .select("id, user_id, event_name, source, metadata, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching event_logs:", error);
      return NextResponse.json(
        { error: "ユーザーログの取得に失敗しました" },
        { status: 500 }
      );
    }

    const logs = (rows ?? []) as Omit<EventLogRow, "profile">[];

    const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))] as string[];
    let profileMap: Record<
      string,
      { display_name: string | null; real_name: string | null; ticket_number: string | null }
    > = {};
    if (userIds.length > 0) {
      const { data: profileList } = await supabase
        .from("profiles")
        .select("id, display_name, real_name, ticket_number")
        .in("id", userIds);
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

    const items: EventLogRow[] = logs.map((log) => ({
      ...log,
      profile: log.user_id ? profileMap[log.user_id] ?? null : null,
    }));

    return NextResponse.json({ logs: items });
  } catch (err) {
    console.error("event-logs API error:", err);
    return NextResponse.json(
      { error: "ユーザーログの取得に失敗しました" },
      { status: 500 }
    );
  }
}
