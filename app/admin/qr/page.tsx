"use client";

import { QRCodeSVG } from "qrcode.react";

// 24_テスト用QRコード表示.md / 24_QRコード表示_LIFFアプリ開発者へ.md で定義したペイロード
// スタンプは「個数」に統一。優良=10個/回、通常=5個/回。LIFF側は stamps を参照すること。
// ※ "points" は廃止。ここでは stamps のみ使用。
const PAYLOAD_PREMIUM = '{"type":"premium","stamps":10}';
const PAYLOAD_REGULAR = '{"type":"regular","stamps":5}';

/** ペイロード文字列をパースして stamps を取得。旧仕様の points が含まれていないか検証用 */
function parsePayload(payload: string): { type: string; stamps: number; hasPoints: boolean } {
  try {
    const o = JSON.parse(payload) as Record<string, unknown>;
    const hasPoints = "points" in o;
    const stamps = typeof o.stamps === "number" ? o.stamps : 0;
    return { type: String(o.type ?? ""), stamps, hasPoints };
  } catch {
    return { type: "", stamps: 0, hasPoints: false };
  }
}

export default function TestQRPage() {
  const premiumParsed = parsePayload(PAYLOAD_PREMIUM);
  const regularParsed = parsePayload(PAYLOAD_REGULAR);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold">テスト用QRコード</h1>
        <p className="text-sm text-slate-600 mt-1">
          LIFFアプリのカメラで読み取って、スタンプ付与の動作をテストできます。
        </p>
        <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
          ⚠ 必ず「ペイロード確認」が <strong>stamps</strong> になっていることを確認してください。&quot;points&quot; は廃止です。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 優良患者様用 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-medium text-slate-800 mb-1">
            優良患者様用
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            1回スキャンあたり <strong>10スタンプ</strong> 付与
          </p>
          <div className="flex justify-center bg-slate-50 rounded-lg p-4">
            <QRCodeSVG
              value={PAYLOAD_PREMIUM}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono" aria-label="ペイロード確認">
            {PAYLOAD_PREMIUM}
          </p>
          <p className="text-xs mt-2" aria-label="ペイロード検証">
            {premiumParsed.hasPoints ? (
              <span className="text-red-600 font-medium">⚠ 旧仕様: &quot;points&quot; が含まれています（表示バグの可能性）</span>
            ) : (
              <span className="text-green-700">✓ 検証: type={premiumParsed.type}, stamps={premiumParsed.stamps}</span>
            )}
          </p>
          <p className="text-xs text-amber-600 mt-4">
            ※ テスト用です。本番では院内に設置したQRをご利用ください。
          </p>
        </div>

        {/* 通常患者様用（stamps:5） */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-medium text-slate-800 mb-1">
            通常患者様用
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            1回スキャンあたり <strong>5スタンプ</strong> 付与
          </p>
          <div className="flex justify-center bg-slate-50 rounded-lg p-4">
            <QRCodeSVG
              value={PAYLOAD_REGULAR}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono" aria-label="ペイロード確認">
            {PAYLOAD_REGULAR}
          </p>
          <p className="text-xs mt-2" aria-label="ペイロード検証">
            {regularParsed.hasPoints ? (
              <span className="text-red-600 font-medium">⚠ 旧仕様: &quot;points&quot; が含まれています（表示バグの可能性）</span>
            ) : (
              <span className="text-green-700">✓ 検証: type={regularParsed.type}, stamps={regularParsed.stamps}</span>
            )}
          </p>
          <p className="text-xs text-amber-600 mt-4">
            ※ テスト用です。本番では院内に設置したQRをご利用ください。
          </p>
        </div>
      </div>
    </div>
  );
}
