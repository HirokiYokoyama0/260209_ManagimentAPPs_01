# Doc と実コードの整合性チェック結果

**実施日:** 2026-02-08  
**対象:** 整理済み .md と、app / components / lib / supabase の実ファイル・実装

---

## 1. サマリ

| 区分 | 内容 |
|------|------|
| **照合した Doc** | 00_ファイル構成、03_管理ダッシュボード仕様書、04_Supabaseセットアップ手順、05_Database_Schema、07_次回来院メモ、08_予約ボタンクリック計測、20_家族ひもづけ仕様検討 |
| **照合した実コード** | app/, components/, lib/, supabase/ のファイル一覧と役割 |
| **不整合** | リンク・ファイル名の誤り、記載漏れ、仕様と実装の食い違いを以下に列挙 |

---

## 2. 00_ファイル構成.md の不整合

### 2.1 supabase/ の記載

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| 004 のファイル名 | 記載: `004_broadcast_logs.sql` → 実体: `004_create_broadcast_logs_table.sql` | Doc を実ファイル名に修正 |
| 007〜012 の記載なし | 実体には `006_add_reservation_clicks.sql` のほか、`008_add_10x_system_columns.sql`, `009_add_family_support.sql`, `009_fix_rls_policies.sql`, `012_add_real_name_column.sql` がある | 実行順序を含め、実ファイル一覧に追記 |

### 2.2 app/api の記載

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| families API の記載なし | 実体に `api/families/route.ts`, `api/families/[family_id]/route.ts`, `api/families/[family_id]/members/route.ts`, `api/families/[family_id]/members/[user_id]/route.ts` がある | 00_ファイル構成の app/api ツリーに families を追記 |

### 2.3 components/ の記載

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| 家族関連コンポーネントの記載なし | 実体に `families-table.tsx`, `create-family-dialog.tsx`, `edit-family-dialog.tsx`, `add-family-member-dialog.tsx`, `remove-family-member-dialog.tsx`, `delete-family-dialog.tsx` がある | admin 配下の一覧に追記 |
| ui の記載不足 | 実体に `select.tsx`, `checkbox.tsx` がある | ui 一覧に追記 |

### 2.4 lib/ の記載

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| supabase の構成 | 記載: 単一ファイル `supabase.ts` → 実体: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/server-admin.ts` のサブフォルダ構成 | 構成説明を実態に合わせて修正 |
| 記載なしのファイル | 実体に `broadcast.ts`, `simple-auth.ts`, `simple-auth-verify.ts`, `line-messaging.ts` がある | 一覧に追記 |

### 2.5 Doc/ セクション（6. Doc/）の記載

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| ファイル名・番号の誤り | `01_README.md` → 正: `00_README.md`。`08_特典交換履歴…` → 正: `07_特典交換履歴…`。`09_重要_スタンプ…` → 正: `08_重要_スタンプ…`。`100_主な機能一覧…` のファイル名が実体と微妙に異なる。`101_LIFF…` は削除済み | 実在するファイル名・番号に合わせて修正し、101 を削除 |
| 参照リンク | 「詳細は [03_Supabaseセットアップ手順.md](03_Supabaseセットアップ手順.md)」→ 正: `04_Supabaseセットアップ手順.md`。「[01_README.md](01_README.md)」→ 正: `00_README.md` | リンク先を修正 |

---

## 3. 03_管理ダッシュボード仕様書.md の不整合

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| 画面・ルート一覧の不足 | 記載は `/admin/login`, `/admin`, `/admin/analysis` のみ。実体に `/admin/broadcast`（一斉配信）、`/admin/reward-exchanges`（特典交換履歴）がある | 8. 画面・ルート構成に broadcast / reward-exchanges を追記 |
| スタンプ「-1」と仕様の関係 | 4.2 に「-1 / +1」と記載あり。一方で 08_重要_スタンプ仕様_積み上げ式.md では「**積み上げ式（減らさない）**」と明記。実装では `patients-table.tsx` に -1 ボタンが存在（`updateStampDelta(p.id, -1)`） | **仕様のどちらを正とするか要判断**。運用で「減らすのは管理者の訂正用」とするなら 03 にその旨を追記。積み上げのみとするなら -1 を廃止する実装変更が必要 |

---

## 4. 05_Database_Schema.md の不整合

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| マイグレーション番号と実ファイルの対応 | スキーマ Doc では 002=stamp_history, 003=rewards など「論理的なスキーマ単位」で番号を振っている。実 supabase/ フォルダでは 002=care_messages, 003=is_line_friend など別体系。両者は「論理スキーマ」と「物理マイグレーション」の対応表として整理されていない | 冒頭または「マイグレーション実行順序」に「supabase/ フォルダのファイル名との対応」を一文で注記することを推奨 |
| 存在しない関連ドキュメントへのリンク | 「03_機能仕様書.md」「10_TODO.md」「90_実装履歴.md」「91_仕様変更履歴.md」は Doc 内に存在しない | 03_管理ダッシュボード仕様書.md、99_変更履歴.md など実在ファイルへのリンクに差し替え |

---

## 5. 20_家族ひもづけ仕様検討.md の不整合

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| 存在しない Doc へのリンク | 「03_機能仕様書.md」「10_TODO.md」へのリンクがあるが、いずれも存在しない | 実在する Doc（例: 03_管理ダッシュボード仕様書、99_変更履歴）に差し替え |

---

## 6. 整合していた項目（参考）

- **app/** の主要ルート: page, admin/page, admin/login, admin/analysis, admin/broadcast, admin/reward-exchanges、api の auth, broadcast, profiles, users/[userId]/reservation-click は 00_ファイル構成・各仕様書と一致（API パスは reward-exchanges で一致）。
- **08_予約ボタンクリック計測**: API パス `POST /api/users/[userId]/reservation-click`、DB カラム `reservation_button_clicks` は実装と一致。
- **07_次回来院メモ**: 編集ダイアログ統合・next_visit_date / next_memo は実装と一致。
- **lib/types.ts**: Profile の real_name, family_id, family_role, reservation_button_clicks, visit_count, next_memo 等は 05_Database_Schema および実装と一致。
- **04_Supabaseセットアップ手順**: 001, 002, 003 のファイル名は実 supabase/ と一致。

---

## 7. 推奨対応の優先度

1. **すぐ修正可能（Doc の誤記・リンク）**  
   - 00_ファイル構成: supabase の 004 のファイル名、Doc セクションのファイル名・リンク（01_README→00_README、03_Supabase→04_Supabase、101 削除、08/09 番号修正）。
   - 05_Database_Schema・20_家族ひもづけ: 存在しない Doc へのリンクを実在ファイルに差し替え。

2. **追記で対応**  
   - 00_ファイル構成: supabase の 008, 009, 009_fix, 012。app/api の families。components の家族関連・ui の select/checkbox。lib の supabase 構成・broadcast, simple-auth, line-messaging。
   - 03_管理ダッシュボード: 画面一覧に /admin/broadcast, /admin/reward-exchanges を追加。

3. **仕様・設計の判断が必要**  
   - スタンプ「-1」: 08_重要（積み上げ式）と 03 の「-1/+1」および実装の -1 ボタンの扱いを統一するか決定する。

---

最終更新: 2026-02-08
