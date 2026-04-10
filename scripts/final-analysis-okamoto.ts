console.log("🔍 岡本さんの登録QR無限ループ問題 - 最終分析\n");
console.log("=" .repeat(80));

console.log("\n📋 発見されたログ（時系列順）:\n");

const logs = [
  {
    time: "2026-04-06 08:17:59 (17:17:59 JST)",
    timestampMs: 1775463479448,
    endpoint: "/api/users/me",
    method: "GET",
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1',
    status: 200,
  },
  {
    time: "2026-04-06 08:17:59 (17:17:59 JST)",
    timestampMs: 1775463479513,
    endpoint: "/api/users/U9cbf2f6988a70fc3c55cf5c907284cb3/memo",
    method: "GET",
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1',
    status: 200,
  },
  {
    time: "2026-04-06 08:18:52 (17:18:52 JST)",
    timestampMs: 1775463532884,
    endpoint: "/api/stamps/auto",
    method: "POST",
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/26.4.0 LIFF',
    status: 200,
    message: "✅ QRスタンプ自動付与成功: U9cbf2f6988a70fc3c55cf5c907284cb3 (+5個 → 合計5個)",
  },
];

logs.forEach((log, index) => {
  console.log(`\n[${index + 1}] ${log.time}`);
  console.log(`    Endpoint: ${log.method} ${log.endpoint}`);
  console.log(`    Status: ${log.status}`);
  console.log(`    User-Agent: ${log.userAgent}`);
  if (log.message) {
    console.log(`    Message: ${log.message}`);
  }
});

console.log("\n\n" + "=".repeat(80));
console.log("🔎 重要な発見\n");

console.log("1️⃣  User-Agent の違い\n");
console.log("   【17:17:59 の2つのリクエスト】");
console.log("   CPU iPhone OS 18_7");
console.log("   Version/26.4 Mobile/15E148 Safari/604.1");
console.log("   → ✅ 正常なiOS 18.7 + Safari 16.4");
console.log("   → ⚠️ 「Safari」と明記されている = 外部ブラウザ");
console.log("");
console.log("   【17:18:52 のリクエスト】");
console.log("   CPU iPhone OS 26_4");
console.log("   Mobile/15E148 Safari Line/26.4.0 LIFF");
console.log("   → ❌ 異常なiOS 26.4（存在しないバージョン）");
console.log("   → ✅ LIFFブラウザ（LINEアプリ内）");

console.log("\n2️⃣  タイムライン分析\n");
const interval1to2 = 1775463479513 - 1775463479448;
const interval2to3 = 1775463532884 - 1775463479513;

console.log("   17:17:59.448 - /api/users/me (Safari)");
console.log(`   ↓ ${interval1to2}ms後`);
console.log("   17:17:59.513 - /api/users/.../memo (Safari)");
console.log(`   ↓ ${interval2to3}ms後 (約${Math.round(interval2to3 / 1000)}秒)`);
console.log("   17:18:52.884 - /api/stamps/auto (LIFF)");

console.log("\n3️⃣  推定される動作\n");
console.log("   📱 17:17:59 - 登録QRスキャン");
console.log("   🌐 17:17:59 - Safari（外部ブラウザ）で開かれる");
console.log("       └→ /api/users/me と /api/users/.../memo を実行");
console.log("   ❓ 17:17:59～17:18:52 - 何が起きた？（約53秒の空白）");
console.log("       - Safariで開いたが、LINEアプリへリダイレクト？");
console.log("       - ユーザーが手動でLINEアプリに戻った？");
console.log("       - ブラウザ ⇔ LINEアプリの切り替えループ？");
console.log("   📲 17:18:52 - LIFFブラウザで再度アクセス");
console.log("       └→ /api/stamps/auto が成功");

console.log("\n4️⃣  結論\n");
console.log("   ⚠️ 登録QRスキャン時に Safari（外部ブラウザ）で開かれた");
console.log("   ⚠️ iOS 18 の変更により、登録QRが外部ブラウザで開く仕様に？");
console.log("   ⚠️ その後、何らかの方法でLIFFブラウザに切り替わった");
console.log("   ⚠️ 53秒の空白は、ブラウザ切り替えの試行錯誤？");

console.log("\n5️⃣  対策案\n");
console.log("   1. 登録QRのURL設定を確認");
console.log("      - LIFF URLを使用しているか？");
console.log("      - 通常のHTTPS URLになっていないか？");
console.log("");
console.log("   2. iOS 18対応の確認");
console.log("      - iOS 18では外部ブラウザ強制オープンの挙動変更あり");
console.log("      - LIFF URLでも外部ブラウザで開かれる可能性");
console.log("");
console.log("   3. 登録フロー改善案");
console.log("      - 外部ブラウザで開かれた場合の誘導UI追加");
console.log("      - 「LINEアプリで開く」ボタンの実装");
console.log("      - liff.openWindow() でLIFFブラウザへ誘導");

console.log("\n" + "=".repeat(80));
console.log("\n✅ 分析完了\n");
console.log("📄 次のステップ:");
console.log("   1. 登録QRのURL設定を確認（LIFF URLか？）");
console.log("   2. LIFFアプリ開発者にiOS 18対応を依頼");
console.log("   3. 外部ブラウザで開かれた場合の対策を実装");
console.log("");
