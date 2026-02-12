import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { ticket_number, last_visit_date, view_mode } = body as {
    ticket_number?: string | null;
    last_visit_date?: string | null;
    view_mode?: string | null;
  };

  const updates: { ticket_number?: string | null; last_visit_date?: string | null; view_mode?: string | null; updated_at?: string } = {
    updated_at: new Date().toISOString(),
  };

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
  return NextResponse.json(data);
}
