import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/care-messages
 * 個別配信ログ一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Number(searchParams.get("limit")) || 50;
    const offset = Number(searchParams.get("offset")) || 0;

    const supabase = createSupabaseAdminClient();

    // care_messages と profiles を JOIN して取得
    let query = supabase
      .from("care_messages")
      .select(
        `
        id,
        profile_id,
        body,
        sent_at,
        created_at,
        profiles (
          display_name,
          real_name,
          ticket_number,
          picture_url
        )
      `,
        { count: "exact" }
      );

    // 日付範囲フィルター
    if (startDate) {
      query = query.gte("sent_at", `${startDate}T00:00:00`);
    }

    if (endDate) {
      query = query.lte("sent_at", `${endDate}T23:59:59`);
    }

    // ソートとページネーション
    const { data, error, count } = await query
      .order("sent_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching care messages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // レスポンス整形
    let messages = (data || []).map((msg: any) => ({
      id: msg.id,
      profile_id: msg.profile_id,
      body: msg.body,
      sent_at: msg.sent_at,
      created_at: msg.created_at,
      patient_name:
        msg.profiles?.display_name || msg.profiles?.real_name || "名前未設定",
      ticket_number: msg.profiles?.ticket_number || null,
      picture_url: msg.profiles?.picture_url || null,
    }));

    // クライアント側で患者名検索フィルター
    if (search) {
      const searchLower = search.toLowerCase();
      messages = messages.filter((msg: any) =>
        msg.patient_name.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      messages,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error in care-messages API:", error);
    return NextResponse.json(
      { error: "メッセージの取得に失敗しました" },
      { status: 500 }
    );
  }
}
