# 017_create_survey_tables.sql 確認メモ

**確認日:** 2026-02-26  
**対象:** supabase/017_create_survey_tables.sql

---

## 実施した修正

### 1. `surveys` の公開フラグ: `active` → `is_active`

- **理由:** 86・87 および LIFF 側のコード例ではすべて **`is_active`** を使用（例: `.eq('surveys.is_active', true)`）。017 のみ `active` だったため、ドキュメント・実装と揃えた。
- **変更箇所:** カラム名、インデックス名（`idx_surveys_active` → `idx_surveys_is_active`）、COMMENT、初期データ INSERT。

---

## 確認結果（問題なし）

| 項目 | 内容 |
|------|------|
| **surveys** | id, title, description, reward_stamps, is_active, start_date, end_date, created_by, created_at, updated_at。87 の Phase 1 案と一致（87 は created_by なしだが拡張として許容）。 |
| **survey_answers** | user_id → profiles(id), survey_id → surveys(id), q1_rating, q2_comment, q3_recommend, UNIQUE(user_id, survey_id)。87 と一致。 |
| **survey_targets** | user_id, survey_id, show_on_liff_open, answered_at, postponed_count, last_postponed_at, UNIQUE(user_id, survey_id)。86 の 4.1 と一致。017 は **shown_count / last_shown_at** を追加（モーダル表示回数用）で、仕様拡張として問題なし。 |
| **RLS** | surveys / survey_answers / survey_targets いずれも anon で SELECT 許可。survey_targets は INSERT/UPDATE も許可。87 の「RLS 緩和＋アプリ層制御」方針と一致。 |
| **RPC** | `increment_survey_postponed(p_user_id, p_survey_id)` で postponed_count + 1, last_postponed_at, updated_at を更新。あわせて shown_count / last_shown_at も更新（「あとで」＝1回表示したとみなす設計）。87 の修正案Bと整合。 |
| **ビュー** | `survey_target_status` は st + s + p を JOIN し、p.real_name, p.display_name を使用（86 の display_name 方針と一致）。VIEW に ORDER BY は含めていないため、PostgreSQL の仕様にも沿っている。 |
| **profiles 参照** | profiles(id), real_name, display_name は 05_Database_Schema の定義と一致。 |
| **初期データ** | satisfaction_2026Q1 を 1 件 INSERT（ON CONFLICT DO NOTHING）。 |

---

## 任意で検討できる点

- **RPC の SECURITY DEFINER:** 87 の例では `SECURITY DEFINER` を付与している。現状は RLS で anon の UPDATE を許可しているため **INVOKER のままで動作する**。のちに RLS を厳格化する場合は、この RPC に DEFINER を付与し、内部で user_id チェックする形にするとよい。
- **surveys.created_by:** 017 のみにあるカラム。87 の表にはないが、監査用として残してよい。

---

**結論:** 上記 1 点の修正のほかは 86・87・05 と整合しており、そのままマイグレーション実行してよい。
