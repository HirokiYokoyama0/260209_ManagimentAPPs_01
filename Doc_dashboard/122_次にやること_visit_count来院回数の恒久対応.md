# 次にやること — visit_count（来院回数）の恒久対応

**作成日**: 2026-06-14
**状態**: 🟡 オーナー判断待ち（保留中）
**種別**: 課題メモ / TODO
**関連**: [121_スタンプ手動操作の出どころ確認_ミニアプリ開発者へ.md](121_スタンプ手動操作の出どころ確認_ミニアプリ開発者へ.md) / [125_管理ダッシュボード開発者へ_新イベントログ連携.md](125_管理ダッシュボード開発者へ_新イベントログ連携.md)（§6 別件）

---

## 0. 要旨

来院回数 `visit_count` の数え方が、実DBの稼働トリガーでは `amount = 10` 基準になっており、実患者の来院回数が正しく集計されていない。**ログ連携（新イベント3種）とは別件**で、対応方針はオーナー判断待ち。

---

## 1. 何が問題か

稼働中トリガーの定義：
- INSERT: [018_fix_survey_reward_trigger.sql](../supabase/018_fix_survey_reward_trigger.sql) → `visit_count = COUNT(*) WHERE amount = 10`
- DELETE: [016B_add_delete_policy_stamp_history.sql](../supabase/016B_add_delete_policy_stamp_history.sql) → `WHERE amount = 10`

このため2つのバグが本番で発生し得る：

| # | 症状 | 原因 |
|---|------|------|
| (a) | **15pt来院が来院に数えられない** | 15pt QR(`location=entrance`)は `amount=15` で、`=10` に一致しない |
| (b) | **手動付与で差分が±10だと来院に誤カウント** | 手動付与の `amount=changeAmount`。例：0→10調整は amount=10 → 来院1回に誤加算 |

`visit_count` は患者一覧・モバイルカード・家族テーブル等でスタッフに表示される＝**画面に見える実害**。

---

## 2. 影響範囲（実測）

調査スクリプト（`scripts/assess-visit-count-impact.ts`、未コミット）で全件評価：

- **テストユーザー4人**（横山浩紀・木村珠奈美・物井愛恵・千葉真紀子）はトリッキーなテストのためズレてOK。
- それを除いても **実患者313人** の visit_count がズレている（大半が「qr来院があるのに visit_count=0」）。

---

## 3. ⚠️ repo分岐の注意（適用前に必須確認）

- LIFF開発者が言及する修正版 **`021_fix_visit_count_for_15_stamps.sql`（stamp_method基準）は、この管理ダッシュボードrepoには存在しない**（あるのは `021_milestone_rewards_migration.sql` のみ）。
- = repoのSQLと本番DBの稼働ロジックが分岐している（このプロジェクトで繰り返し発生）。
- **本番適用前に、LIFF側repoの実SQLを共有してもらい、現repoと突き合わせること。** repoのSQLを鵜呑みにしない。

---

## 4. 対応手順（合意済みの方針）

1. **オーナーが「来院とみなす `stamp_method`」を確定**する
   - 最低限 `qr`, `qr_scan` は来院。
   - `manual_admin` / `survey_reward` / `slot_game` / `purchase_incentive` / `import` を来院に含めるかは要判断。
2. **トリガー修正SQL + 既存 visit_count の一括再計算(backfill)スクリプトをドラフト**（この時点では適用しない）。
   - トリガー再定義（`CREATE OR REPLACE FUNCTION`）だけでは過去分は直らない → backfill が必要。
3. **本番適用**（SupabaseのDB変更）
   - オーナー承認後。大量ユーザー運用中につき：**バックアップ → オフピーク → トランザクション/バッチ**で慎重に。

---

## 5. 当面の暫定策

- **LIFF側で合意済み**：手動付与の `amount` を来院判定値(10/15)と衝突させない。
- ただしこれは**新規の誤カウント防止のみ**。既存313人は直らない（恒久対応の backfill が必要）。

---

## 6. 決着済み（対応不要）

- **`staff_id=null`**：LIFFは患者エンドユーザー専用アプリで、手動付与は共有PIN（`NEXT_PUBLIC_STAFF_PIN`）運用のためスタッフ識別子を持たない。ダッシュボード側の対応事項なし。ダッシュボード発の手動変更は従来どおり `activity_logs.staff_id` で識別可能。

---

## 改訂履歴
| 日付 | 内容 |
|------|------|
| 2026-06-14 | 初版作成（保留中の課題メモ） |
