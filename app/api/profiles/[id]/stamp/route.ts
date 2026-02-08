import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { delta } = body as { delta: number };

  if (typeof delta !== "number" || !Number.isInteger(delta)) {
    return NextResponse.json({ error: "Invalid delta" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase
    .from("profiles")
    .select("stamp_count")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const newCount = Math.max(0, current.stamp_count + delta);

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
