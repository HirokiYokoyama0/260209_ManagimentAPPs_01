import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findIOS26Users() {
  console.log("🔍 iOS 26_3_1 User-Agentを持つユーザーを検索\n");
  console.log("=" .repeat(80));

  // event_logsからiOS 26_3_1を含むUser-Agentを検索
  const { data: eventLogs } = await supabase
    .from("event_logs")
    .select("user_id, created_at, event_type, metadata")
    .like("metadata->user_agent", "%26_3_1%")
    .gte("created_at", "2026-04-07T00:00:00Z")
    .lt("created_at", "2026-04-08T00:00:00Z")
    .order("created_at", { ascending: true });

  if (!eventLogs || eventLogs.length === 0) {
    console.log("❌ iOS 26_3_1のUser-Agentが見つかりませんでした");

    // 全ユーザーのメタデータからUser-Agentを検索
    console.log("\n別の方法で検索中...\n");

    const { data: allLogs } = await supabase
      .from("event_logs")
      .select("user_id, created_at, metadata")
      .gte("created_at", "2026-04-07T00:00:00Z")
      .lt("created_at", "2026-04-08T00:00:00Z")
      .limit(1000);

    if (allLogs) {
      const ios26Users = new Set<string>();

      allLogs.forEach(log => {
        try {
          const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
          if (meta && meta.user_agent && meta.user_agent.includes("26_3_1")) {
            ios26Users.add(log.user_id);
          }
        } catch (e) {
          // JSON parse error, skip
        }
      });

      console.log(`\n📊 iOS 26_3_1を持つユーザー数: ${ios26Users.size}人\n`);

      // 各ユーザーの詳細情報を取得
      for (const userId of ios26Users) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, ticket_number, stamp_count, created_at")
          .eq("id", userId)
          .single();

        if (profile) {
          console.log(`\n👤 ${profile.display_name} (診察券${profile.ticket_number})`);
          console.log(`   User ID: ${userId}`);
          console.log(`   スタンプ数: ${profile.stamp_count}個`);
          console.log(`   登録日: ${new Date(profile.created_at).toLocaleString("ja-JP")}`);

          // 4/7のスタンプ履歴
          const { data: stamps } = await supabase
            .from("stamp_history")
            .select("amount, stamp_method, notes, qr_code_id, visit_date")
            .eq("user_id", userId)
            .gte("visit_date", "2026-04-07T00:00:00Z")
            .lt("visit_date", "2026-04-08T00:00:00Z")
            .order("visit_date", { ascending: true });

          if (stamps && stamps.length > 0) {
            console.log(`   4/7のスタンプ記録:`);
            stamps.forEach(stamp => {
              const time = new Date(stamp.visit_date).toLocaleTimeString("ja-JP");
              console.log(`      ${time} - ${stamp.amount > 0 ? "+" : ""}${stamp.amount}個 (${stamp.stamp_method})`);

              // 15ポイント問題の確認
              if (stamp.qr_code_id && stamp.qr_code_id.includes("amount=15") && stamp.amount === 10) {
                console.log(`         ⚠️ 15ポイントQRで10ポイント付与問題あり`);
              }
              if (stamp.qr_code_id && stamp.qr_code_id.includes("amount=15") && stamp.amount === 15) {
                console.log(`         ✅ 15ポイントQRで正常に15ポイント付与`);
              }
            });
          }
        }
      }
    }

    console.log("\n" + "=".repeat(80));
    return;
  }

  // iOS 26_3_1のユーザーをリストアップ
  const userIds = new Set(eventLogs.map(log => log.user_id));

  console.log(`\n📊 該当ユーザー数: ${userIds.size}人\n`);

  for (const userId of userIds) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profile) {
      console.log(`\n👤 ${profile.display_name} (診察券${profile.ticket_number})`);
      console.log(`   User ID: ${userId}`);
      console.log(`   スタンプ数: ${profile.stamp_count}個`);

      // このユーザーのiOS 26_3_1イベント
      const userLogs = eventLogs.filter(log => log.user_id === userId);
      console.log(`   iOS 26_3_1での記録: ${userLogs.length}件`);

      // 最初と最後のアクセス
      if (userLogs.length > 0) {
        const first = new Date(userLogs[0].created_at).toLocaleString("ja-JP");
        const last = new Date(userLogs[userLogs.length - 1].created_at).toLocaleString("ja-JP");
        console.log(`   期間: ${first} ～ ${last}`);
      }
    }
  }

  console.log("\n" + "=".repeat(80));
}

findIOS26Users().catch(console.error);
