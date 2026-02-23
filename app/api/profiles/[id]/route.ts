import { logActivityIfStaff } from "@/lib/activity-log";
import { isValidMemoLength } from "@/lib/memo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { real_name, ticket_number, last_visit_date, view_mode, next_visit_date, next_memo } = body as {
    real_name?: string | null;
    ticket_number?: string | null;
    last_visit_date?: string | null;
    view_mode?: string | null;
    next_visit_date?: string | null;
    next_memo?: string | null;
  };

  // バリデーション: 次回メモの文字数チェック
  if (next_memo && !isValidMemoLength(next_memo)) {
    return NextResponse.json(
      { error: "メッセージは200文字以内で入力してください" },
      { status: 400 }
    );
  }

  const updates: {
    real_name?: string | null;
    ticket_number?: string | null;
    last_visit_date?: string | null;
    view_mode?: string | null;
    next_visit_date?: string | null;
    next_memo?: string | null;
    updated_at?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (real_name !== undefined) {
    updates.real_name = real_name === "" ? null : String(real_name);
  }
  if (ticket_number !== undefined) {
    updates.ticket_number = ticket_number === "" ? null : String(ticket_number);
  }
  if (last_visit_date !== undefined) {
    if (last_visit_date === "" || last_visit_date === null) {
      updates.last_visit_date = null;
    } else {
      const dateStr = String(last_visit_date).trim();
      if (dateStr.length >= 10) {
        updates.last_visit_date = new Date(dateStr.slice(0, 10) + "T00:00:00+09:00").toISOString();
      }
    }
  }
  if (view_mode !== undefined) {
    updates.view_mode = view_mode === "" ? null : String(view_mode);
  }
  if (next_visit_date !== undefined) {
    updates.next_visit_date = next_visit_date === "" ? null : String(next_visit_date);
  }
  if (next_memo !== undefined) {
    updates.next_memo = next_memo === "" ? null : String(next_memo);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logActivityIfStaff(request, "profile_update", {
    targetType: "profile",
    targetId: id,
    details: { fields: Object.keys(updates).filter((k) => k !== "updated_at") },
  });
  return NextResponse.json(data);
}
