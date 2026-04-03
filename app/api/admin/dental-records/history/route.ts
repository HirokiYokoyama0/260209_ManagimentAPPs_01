import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json(
      { error: "patientId is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("patient_dental_records")
      .select("*")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch records" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
