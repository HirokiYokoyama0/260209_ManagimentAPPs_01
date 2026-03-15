/**
 * Supabaseデータベースの容量使用状況を確認
 *
 * 実行: npx tsx scripts/check-database-size.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface TableSize {
  table_name: string;
  row_count: number;
  total_size: string;
  table_size: string;
  indexes_size: string;
}

async function main() {
  console.log("=".repeat(80));
  console.log("📊 Supabaseデータベースの容量使用状況");
  console.log("=".repeat(80));
  console.log();

  // テーブルサイズを取得
  const { data: tableSizes, error } = await supabase.rpc("get_table_sizes");

  if (error) {
    console.log("⚠️  RPC関数 'get_table_sizes' が存在しないため、代替方法で確認します");
    console.log();
    await checkTableSizesManually();
    return;
  }

  if (!tableSizes || tableSizes.length === 0) {
    console.log("⚠️  テーブルサイズ情報を取得できませんでした");
    await checkTableSizesManually();
    return;
  }

  console.log("📋 テーブルごとの容量:");
  console.log();

  let totalBytes = 0;

  tableSizes.forEach((table: TableSize) => {
    console.log(`📌 ${table.table_name}`);
    console.log(`   レコード数: ${table.row_count.toLocaleString()}件`);
    console.log(`   テーブルサイズ: ${table.table_size}`);
    console.log(`   インデックスサイズ: ${table.indexes_size}`);
    console.log(`   合計サイズ: ${table.total_size}`);
    console.log();

    // サイズをバイト数に変換（簡易）
    const sizeMatch = table.total_size.match(/(\d+)\s*(\w+)/);
    if (sizeMatch) {
      const value = parseInt(sizeMatch[1]);
      const unit = sizeMatch[2].toLowerCase();
      let bytes = value;
      if (unit.includes("kb")) bytes = value * 1024;
      if (unit.includes("mb")) bytes = value * 1024 * 1024;
      if (unit.includes("gb")) bytes = value * 1024 * 1024 * 1024;
      totalBytes += bytes;
    }
  });

  console.log("=".repeat(80));
  console.log("💾 合計使用容量:");
  console.log(`   ${formatBytes(totalBytes)}`);
  console.log("=".repeat(80));
  console.log();

  // Supabase Free tier制限
  const freeTierLimit = 500 * 1024 * 1024; // 500MB
  const usagePercent = (totalBytes / freeTierLimit) * 100;

  console.log("📊 Supabase Free tier制限との比較:");
  console.log(`   制限: 500 MB`);
  console.log(`   使用: ${formatBytes(totalBytes)} (${usagePercent.toFixed(2)}%)`);
  console.log(`   残り: ${formatBytes(freeTierLimit - totalBytes)}`);
  console.log();

  if (usagePercent > 80) {
    console.log("⚠️  警告: 容量が80%を超えています");
  } else if (usagePercent > 50) {
    console.log("💡 注意: 容量が50%を超えています");
  } else {
    console.log("✅ 容量に余裕があります");
  }
  console.log();
}

async function checkTableSizesManually() {
  console.log("📋 手動でテーブルサイズを確認中...");
  console.log();

  const tables = [
    "profiles",
    "stamp_history",
    "families",
    "family_members",
    "care_messages",
    "broadcast_messages",
    "reward_exchanges",
    "staff",
    "activity_logs",
    "event_logs",
    "patient_dental_records",
  ];

  let totalRows = 0;

  for (const tableName of tables) {
    const { count, error } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(`❌ ${tableName}: エラー (${error.message})`);
      continue;
    }

    console.log(`📌 ${tableName}: ${(count || 0).toLocaleString()}件`);
    totalRows += count || 0;
  }

  console.log();
  console.log("=".repeat(80));
  console.log(`💾 合計レコード数: ${totalRows.toLocaleString()}件`);
  console.log("=".repeat(80));
  console.log();

  // 概算サイズ（1レコードあたり平均1KBと仮定）
  const estimatedBytes = totalRows * 1024;
  console.log("📊 概算使用容量:");
  console.log(`   ${formatBytes(estimatedBytes)} (1レコード=1KBと仮定)`);
  console.log();

  const freeTierLimit = 500 * 1024 * 1024; // 500MB
  const usagePercent = (estimatedBytes / freeTierLimit) * 100;

  console.log("📊 Supabase Free tier制限との比較:");
  console.log(`   制限: 500 MB`);
  console.log(`   概算使用: ${formatBytes(estimatedBytes)} (${usagePercent.toFixed(2)}%)`);
  console.log(`   概算残り: ${formatBytes(freeTierLimit - estimatedBytes)}`);
  console.log();

  if (usagePercent > 80) {
    console.log("⚠️  警告: 容量が80%を超える可能性があります");
  } else if (usagePercent > 50) {
    console.log("💡 注意: 容量が50%を超える可能性があります");
  } else {
    console.log("✅ 容量に余裕があります");
  }
  console.log();

  // 今後の予測
  await predictFutureUsage(totalRows, estimatedBytes);
}

async function predictFutureUsage(currentRows: number, currentBytes: number) {
  console.log("=".repeat(80));
  console.log("🔮 今後の容量予測");
  console.log("=".repeat(80));
  console.log();

  // プロフィール数を取得
  const { count: profileCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // スタンプ履歴数を取得
  const { count: stampCount } = await supabase
    .from("stamp_history")
    .select("*", { count: "exact", head: true });

  const avgStampsPerUser = (stampCount || 0) / (profileCount || 1);

  console.log("📊 現在の状況:");
  console.log(`   患者数: ${(profileCount || 0).toLocaleString()}人`);
  console.log(`   スタンプ履歴: ${(stampCount || 0).toLocaleString()}件`);
  console.log(`   1人あたり平均スタンプ: ${avgStampsPerUser.toFixed(1)}個`);
  console.log();

  console.log("🔮 予測シナリオ:");
  console.log();

  // シナリオ1: 患者数が1000人、平均20スタンプ
  const scenario1 = {
    patients: 1000,
    stampsPerPatient: 20,
  };
  const scenario1Stamps = scenario1.patients * scenario1.stampsPerPatient;
  const scenario1Bytes = (scenario1.patients + scenario1Stamps) * 1024;

  console.log("シナリオ1: 患者1000人、平均20スタンプ");
  console.log(`   想定レコード数: ${scenario1Stamps.toLocaleString()}件`);
  console.log(`   概算容量: ${formatBytes(scenario1Bytes)}`);
  console.log(`   Free tier残り: ${formatBytes(500 * 1024 * 1024 - scenario1Bytes)}`);
  console.log();

  // シナリオ2: 患者数が5000人、平均30スタンプ
  const scenario2 = {
    patients: 5000,
    stampsPerPatient: 30,
  };
  const scenario2Stamps = scenario2.patients * scenario2.stampsPerPatient;
  const scenario2Bytes = (scenario2.patients + scenario2Stamps) * 1024;

  console.log("シナリオ2: 患者5000人、平均30スタンプ");
  console.log(`   想定レコード数: ${scenario2Stamps.toLocaleString()}件`);
  console.log(`   概算容量: ${formatBytes(scenario2Bytes)}`);
  console.log(`   Free tier残り: ${formatBytes(500 * 1024 * 1024 - scenario2Bytes)}`);
  console.log();

  // シナリオ3: 患者数が10000人、平均50スタンプ
  const scenario3 = {
    patients: 10000,
    stampsPerPatient: 50,
  };
  const scenario3Stamps = scenario3.patients * scenario3.stampsPerPatient;
  const scenario3Bytes = (scenario3.patients + scenario3Stamps) * 1024;

  console.log("シナリオ3: 患者10000人、平均50スタンプ");
  console.log(`   想定レコード数: ${scenario3Stamps.toLocaleString()}件`);
  console.log(`   概算容量: ${formatBytes(scenario3Bytes)}`);
  if (scenario3Bytes > 500 * 1024 * 1024) {
    console.log(`   ⚠️  Free tierを超過: +${formatBytes(scenario3Bytes - 500 * 1024 * 1024)}`);
  } else {
    console.log(`   Free tier残り: ${formatBytes(500 * 1024 * 1024 - scenario3Bytes)}`);
  }
  console.log();

  console.log("💡 推奨事項:");
  if (scenario1Bytes > 400 * 1024 * 1024) {
    console.log("   - 早めに有料プラン（Pro: $25/month）への移行を検討");
  } else if (scenario2Bytes > 400 * 1024 * 1024) {
    console.log("   - 患者数5000人を超える場合、有料プランを検討");
  } else {
    console.log("   - 当面はFree tierで運用可能");
  }
  console.log();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

main().catch(console.error);
