"use client";

import { QRCodeSVG } from "qrcode.react";

// 54_スタンプ仕様変更_LIFFアプリ開発者へ.md で定義したペイロード
// スタンプは「個数」に統一。優良=15個/回、通常=10個/回、購買インセンティブ=5個/回（何度でも可）
// LIFF側は stamps を参照すること。
// ※ "points" は廃止。ここでは stamps のみ使用。
const PAYLOAD_PREMIUM = '{"type":"premium","stamps":15}';
const PAYLOAD_REGULAR = '{"type":"regular","stamps":10}';
const PAYLOAD_PURCHASE = '{"type":"purchase","stamps":5}';
const PAYLOAD_SLOT_UNLOCK = '{"type":"slot-unlock","target":"family"}';

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
  const purchaseParsed = parsePayload(PAYLOAD_PURCHASE);

  // カメラ用LIFF URL（直接起動）
  const LIFF_URL_CAMERA_PREMIUM = "https://liff.line.me/2009075851-74EieWb4?action=stamp&type=qr&amount=15&location=entrance";
  const LIFF_URL_CAMERA_REGULAR = "https://liff.line.me/2009075851-74EieWb4?action=stamp&type=qr&amount=10&location=entrance";
  const LIFF_URL_CAMERA_PURCHASE = "https://liff.line.me/2009075851-74EieWb4?action=stamp&type=purchase&amount=5&location=shop";

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

      {/* カメラ用QRコード（直接LIFF起動） */}
      <div className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold mb-2">📸 カメラ用QRコード（直接LIFF起動）</h2>
        <p className="text-sm text-slate-600 mb-4">
          QRスキャン → LIFF起動 → URLパラメータ検出 → 自動API実行 → 完了画面
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* カメラ用: Premium 15スタンプ */}
          <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-6 shadow-sm">
            <h3 className="text-base font-medium text-blue-900 mb-1">
              📸 優良患者様用（15スタンプ）
            </h3>
            <p className="text-xs text-blue-700 mb-4">
              来院時1回のみスキャン可能
            </p>
            <div className="flex justify-center bg-white rounded-lg p-4">
              <QRCodeSVG
                value={LIFF_URL_CAMERA_PREMIUM}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 break-all font-mono">
              {LIFF_URL_CAMERA_PREMIUM}
            </p>
            <p className="text-xs text-blue-600 mt-3">
              ✓ URLパラメータ: amount=15, location=entrance
            </p>
          </div>

          {/* カメラ用: Regular 10スタンプ */}
          <div className="rounded-xl border-2 border-green-300 bg-green-50 p-6 shadow-sm">
            <h3 className="text-base font-medium text-green-900 mb-1">
              📸 通常患者様用（10スタンプ）
            </h3>
            <p className="text-xs text-green-700 mb-4">
              来院時1回のみスキャン可能
            </p>
            <div className="flex justify-center bg-white rounded-lg p-4">
              <QRCodeSVG
                value={LIFF_URL_CAMERA_REGULAR}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 break-all font-mono">
              {LIFF_URL_CAMERA_REGULAR}
            </p>
            <p className="text-xs text-green-600 mt-3">
              ✓ URLパラメータ: amount=10, location=entrance
            </p>
          </div>

          {/* カメラ用: Purchase 5スタンプ（新規） */}
          <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-6 shadow-sm">
            <h3 className="text-base font-medium text-orange-900 mb-1">
              🛒 購買インセンティブ（5スタンプ）
            </h3>
            <p className="text-xs text-orange-700 mb-4">
              来院時何度でもスキャン可能
            </p>
            <div className="flex justify-center bg-white rounded-lg p-4">
              <QRCodeSVG
                value={LIFF_URL_CAMERA_PURCHASE}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 break-all font-mono">
              {LIFF_URL_CAMERA_PURCHASE}
            </p>
            <p className="text-xs text-orange-600 mt-3">
              ✓ URLパラメータ: type=purchase, amount=5, location=shop
            </p>
            <p className="text-xs text-amber-700 mt-3 bg-amber-100 border border-amber-300 rounded px-2 py-1">
              ⚠ 注意: 繰り返しスキャン可能。運用時はスタッフ立会いのもと使用
            </p>
          </div>
        </div>
      </div>

      {/* 既存のペイロード型QRコード */}
      <div className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold mb-2">📱 アプリ内スキャン用（ペイロード型）</h2>
        <p className="text-sm text-slate-600 mb-4">
          LIFFアプリ内のカメラ機能で読み取るタイプ
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 優良患者様用 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-medium text-slate-800 mb-1">
            優良患者様用
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            1回スキャンあたり <strong>15スタンプ</strong> 付与
          </p>
          <div className="flex justify-center bg-slate-50 rounded-lg p-4">
            <QRCodeSVG
              value={PAYLOAD_PREMIUM}
              size={180}
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

        {/* 通常患者様用 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-medium text-slate-800 mb-1">
            通常患者様用
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            1回スキャンあたり <strong>10スタンプ</strong> 付与
          </p>
          <div className="flex justify-center bg-slate-50 rounded-lg p-4">
            <QRCodeSVG
              value={PAYLOAD_REGULAR}
              size={180}
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

        {/* 購買インセンティブ用（新規） */}
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
          <h2 className="text-base font-medium text-orange-800 mb-1">
            購買インセンティブ用
          </h2>
          <p className="text-xs text-orange-600 mb-4">
            1回スキャンあたり <strong>5スタンプ</strong> 付与（何度でも可）
          </p>
          <div className="flex justify-center bg-white rounded-lg p-4">
            <QRCodeSVG
              value={PAYLOAD_PURCHASE}
              size={180}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono" aria-label="ペイロード確認">
            {PAYLOAD_PURCHASE}
          </p>
          <p className="text-xs mt-2" aria-label="ペイロード検証">
            {purchaseParsed.hasPoints ? (
              <span className="text-red-600 font-medium">⚠ 旧仕様: &quot;points&quot; が含まれています（表示バグの可能性）</span>
            ) : (
              <span className="text-green-700">✓ 検証: type={purchaseParsed.type}, stamps={purchaseParsed.stamps}</span>
            )}
          </p>
          <p className="text-xs text-amber-700 mt-4 bg-amber-100 border border-amber-300 rounded px-2 py-1">
            ⚠ 注意: 繰り返しスキャン可能。スタッフ立会いのもと使用
          </p>
        </div>

        {/* スロットゲーム解放用（キッズ用） */}
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
          <h2 className="text-base font-medium text-purple-800 mb-1">
            スロットゲーム解放用
          </h2>
          <p className="text-xs text-purple-600 mb-4">
            家族全員がスロットゲームをプレイ可能に
          </p>
          <div className="flex justify-center bg-white rounded-lg p-4">
            <QRCodeSVG
              value={PAYLOAD_SLOT_UNLOCK}
              size={180}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono" aria-label="ペイロード確認">
            {PAYLOAD_SLOT_UNLOCK}
          </p>
          <p className="text-xs mt-2 text-purple-700" aria-label="ペイロード検証">
            ✓ ペイロード: type=slot-unlock, target=family
          </p>
          <p className="text-xs text-purple-700 mt-4 bg-purple-100 border border-purple-300 rounded px-2 py-1">
            ✓ 来院時1日1回スキャン可能。家族全員がキッズゲーム解放
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
