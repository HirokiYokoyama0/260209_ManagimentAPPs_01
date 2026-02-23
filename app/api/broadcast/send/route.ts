import { logActivityIfStaff } from "@/lib/activity-log";
import { filterProfilesBySegment, replaceMessageVariables } from "@/lib/broadcast";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { BroadcastSendRequest, Profile } from "@/lib/types";

/**
 * POST /api/broadcast/send
 * 一斉配信を実行
 */
export async function POST(request: NextRequest) {
  try {
    const body: BroadcastSendRequest = await request.json();
    const { segment, message, sentBy } = body;

    const supabase = await createSupabaseServerClient();

    // 1. 対象者を取得
    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("*");

    if (fetchError || !profiles) {
      console.error("Error fetching profiles:", fetchError);
      return NextResponse.json(
        { success: false, error: "患者データの取得に失敗しました" },
        { status: 500 }
      );
    }

    // 2. セグメント条件でフィルタリング
    const targetProfiles = filterProfilesBySegment(profiles as Profile[], segment);

    if (targetProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        broadcastLogId: "",
        targetCount: 0,
        successCount: 0,
        failedCount: 0,
      });
    }

    // 3. LINE IDを抽出（友だち登録済みのみ）
    const lineIds = targetProfiles
      .filter((p) => p.line_user_id && p.is_line_friend === true)
      .map((p) => p.line_user_id);

    let successCount = 0;
    let failedCount = 0;

    // 4. LINE Messaging API で送信（個別に変数置換）
    if (lineIds.length > 0) {
      try {
        const result = await sendPersonalizedMessages(message, targetProfiles);
        successCount = result.successCount;
        failedCount = result.failedCount;
      } catch (error) {
        console.error("Error sending messages:", error);
        failedCount = lineIds.length;
      }
    }

    // 5. 配信ログを保存
    const { data: log, error: logError } = await supabase
      .from("broadcast_logs")
      .insert({
        sent_by: sentBy,
        segment_conditions: segment,
        message_text: message,
        target_count: targetProfiles.length,
        success_count: successCount,
        failed_count: failedCount,
      })
      .select()
      .single();

    if (logError) {
      console.error("Error saving broadcast log:", logError);
    }

    await logActivityIfStaff(request, "broadcast_send", {
      details: { recipient_count: targetProfiles.length },
    });

    return NextResponse.json({
      success: true,
      broadcastLogId: log?.id || "",
      targetCount: targetProfiles.length,
      successCount,
      failedCount,
    });
  } catch (error) {
    console.error("Error in broadcast send:", error);
    return NextResponse.json(
      { success: false, error: "配信に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * 各ユーザーごとに変数置換してメッセージを送信
 */
async function sendPersonalizedMessages(
  messageTemplate: string,
  profiles: Profile[]
): Promise<{ successCount: number; failedCount: number }> {
  const accessToken =
    process.env.LINE_CHANNEL_ACCESS_TOKEN ||
    (await getShortLivedToken());

  if (!accessToken) {
    throw new Error("LINE Channel Access Token が設定されていません");
  }

  let successCount = 0;
  let failedCount = 0;

  // LINE友だち登録済みのユーザーのみ
  const targetUsers = profiles.filter(
    (p) => p.line_user_id && p.is_line_friend === true
  );

  // 各ユーザーごとに個別送信（Push Message API）
  for (const profile of targetUsers) {
    try {
      // 変数を置換
      const personalizedMessage = replaceMessageVariables(messageTemplate, profile);

      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: profile.line_user_id,
          messages: [
            {
              type: "text",
              text: personalizedMessage,
            },
          ],
        }),
      });

      if (response.ok) {
        successCount++;
      } else {
        const errorData = await response.json();
        console.error(`LINE API Error for ${profile.display_name}:`, errorData);
        failedCount++;
      }

      // レート制限対策: 各送信後に50ms待機（1秒間に最大20件）
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`Error sending to ${profile.display_name}:`, error);
      failedCount++;
    }
  }

  return { successCount, failedCount };
}

/**
 * 短期アクセストークンを取得（Channel ID/Secret方式）
 */
async function getShortLivedToken(): Promise<string | null> {
  const channelId = process.env.LINE_CHANNEL_ID || process.env.Channel_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET || process.env.Channel_secret;

  if (!channelId || !channelSecret) {
    return null;
  }

  try {
    const response = await fetch("https://api.line.me/v2/oauth/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: channelId,
        client_secret: channelSecret,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }
  } catch (error) {
    console.error("Error getting LINE access token:", error);
  }

  return null;
}
