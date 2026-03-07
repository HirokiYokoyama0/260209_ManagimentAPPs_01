import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    const { patient_id, tooth_data, next_visit_memo, staff_memo, recorded_at } = body;

    // バリデーション
    if (!patient_id || !tooth_data) {
      return NextResponse.json(
        { error: "patient_id and tooth_data are required" },
        { status: 400 }
      );
    }

    // スタッフIDの取得（仮実装：将来的にはセッションから取得）
    // 現在はNULLで保存
    const staff_id = null;

    // service_role で挿入（RLSをバイパス）
    const { data, error } = await supabase
      .from("patient_dental_records")
      .insert([
        {
          patient_id,
          staff_id,
          tooth_data,
          next_visit_memo,
          staff_memo,
          recorded_at: recorded_at || new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save dental record", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const patient_id = searchParams.get("patient_id");

    if (!patient_id) {
      return NextResponse.json(
        { error: "patient_id is required" },
        { status: 400 }
      );
    }

    // 最新の記録を取得
    const { data, error } = await supabase
      .from("patient_dental_records")
      .select("*")
      .eq("patient_id", patient_id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch dental record" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || null);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
