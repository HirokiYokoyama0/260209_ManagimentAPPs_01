import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pushMessage } from "@/lib/line-messaging";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: profileId } = await params;
  const body = await request.json();
  const { body: messageBody } = body as { body: string };

  if (typeof messageBody !== "string" || !messageBody.trim()) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const trimmedBody = messageBody.trim();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("care_messages")
    .insert({
      profile_id: profileId,
      body: trimmedBody,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // LINE Messaging API でプッシュ送信（.env.local に Channel ID/Secret または Access Token がある場合）
  const lineResult = await pushMessage(profileId, trimmedBody);

  return NextResponse.json({
    ...data,
    line_push: lineResult.ok ? "sent" : "skipped",
    line_error: lineResult.error ?? undefined,
  });
}
