import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const MAX_STAMPS = 999;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { stamp_count: newCount } = body as { stamp_count: number };

  if (
    typeof newCount !== "number" ||
    !Number.isInteger(newCount) ||
    newCount < 0 ||
    newCount > MAX_STAMPS
  ) {
    return NextResponse.json(
      { error: `stamp_count must be 0–${MAX_STAMPS}` },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      stamp_count: newCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
