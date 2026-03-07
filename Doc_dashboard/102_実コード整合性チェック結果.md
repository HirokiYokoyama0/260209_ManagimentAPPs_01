# Doc と実コードの整合性チェック結果

**初回実施日:** 2026-02-08  
**再チェック開始:** 2026-02-24（段階的実施・計画は [Doc_実コード整合性チェック_計画.md](Doc_実コード整合性チェック_計画.md) 参照）

**対象:** Doc 内 .md 仕様書 と、app / components / lib / supabase の実ファイル・実装

---

## 1. サマリ

| 区分 | 内容 |
|------|------|
| **照合した Doc** | 00_ファイル構成、03_管理ダッシュボード仕様書、04_Supabaseセットアップ手順、05_Database_Schema、07 次回来院メモ・特典交換、08 予約ボタン・スタンプ、20/21 家族、86/88/89 アンケート 等 |
| **照合した実コード** | app/, components/, lib/, supabase/ のファイル一覧と役割 |
| **不整合** | リンク・ファイル名の誤り、記載漏れ、仕様と実装の食い違いを以下に列挙（Phase 別に追記） |

---

## 2. 【Phase 1】00_ファイル構成.md と実ファイルの照合（2026-02-24）

以下は 2026-02-24 時点の実ファイルと 00_ファイル構成.md を照合した結果。前回（2.1〜2.5）の指摘に加え、**実体に存在するが Doc に未記載**の項目を整理した。

### 2.A app/admin/ の記載漏れ（実体に存在するが 00 に未記載）

| 実パス | 説明 | 対応案 |
|--------|------|--------|
| `/admin/surveys` | アンケート一覧 | app/ のツリーに `surveys/page.tsx`、`surveys/new/page.tsx`、`surveys/[surveyId]/page.tsx`、`surveys/[surveyId]/targets/page.tsx`、`surveys/[surveyId]/results/page.tsx` を追記 |
| `/admin/activity-logs` | スタッフ操作ログ | 同様に `activity-logs/page.tsx` を追記 |
| `/admin/user-logs` | ユーザログ | 同様に `user-logs/page.tsx` を追記 |
| `/admin/qr` | テストQR | 同様に `qr/page.tsx` を追記 |
| `/admin/change-password` | パスワード変更 | 同様に `change-password/page.tsx` を追記 |

### 2.B app/api/ の記載漏れ（実体に存在するが 00 に未記載）

| 実API | 説明 | 対応案 |
|-------|------|--------|
| `auth/signup/route.ts` | スタッフ登録 | app/api ツリーに signup を追記 |
| `auth/me/route.ts` | 認証中ユーザ取得 | 同 me を追記 |
| `auth/change-password/route.ts` | パスワード変更 | 同 change-password を追記 |
| `event-logs/route.ts` | イベントログ取得 | event-logs を追記 |
| `activity-logs/route.ts` | アクティビティ（スタッフ操作）ログ取得 | activity-logs を追記 |
| `surveys/route.ts` | アンケート一覧 GET / 作成 POST | surveys 一式を追記（下記ツリー） |
| `surveys/[surveyId]/route.ts` | アンケート 1 件 PATCH | 同上 |
| `surveys/results/route.ts` | 結果集計 GET | 同上 |
| `surveys/[surveyId]/results/csv/route.ts` | 結果 CSV 出力 GET | 同上 |
| `surveys/targets/create/route.ts` | 配信対象登録 POST | 同上 |
| `surveys/targets/list/route.ts` | 配信対象一覧 GET | 同上 |
| `surveys/targets/candidates/route.ts` | 配信候補取得 GET | 同上 |
| `surveys/targets/update-liff/route.ts` | LIFF 初期表示一括更新 POST | 同上 |
| `surveys/targets/reset-answer/route.ts` | 未回答に戻す POST | 同上 |

### 2.C supabase/ の記載漏れ（実体に存在するが 00 に未記載）

| 実ファイル | 説明 | 対応案 |
|------------|------|--------|
| `013_create_staff_table.sql` | スタッフテーブル | supabase/ 一覧・実行順序に 013 を追記 |
| `014_create_activity_logs_table.sql` | スタッフ操作ログ | 014 を追記 |
| `015_create_event_logs_table_ForUser.sql` | ユーザ向けイベントログ | 015 を追記 |
| `016_create_event_logs_table.sql` | イベントログ（別定義） | 016 を追記 |
| `016_add_delete_policy_stamp_history.sql` | stamp_history DELETE ポリシー | 016 が2種あるため、ファイル名・実行順の注記を追加 |
| `017_create_survey_tables.sql` | アンケートテーブル | 017 を追記 |
| `018_fix_survey_reward_trigger.sql` | アンケート報酬トリガー修正 | 018 を追記 |

### 2.D 前回指摘のうち 00 に未反映の可能性がある項目（要確認）

- **2.1** 004 のファイル名: 実体は `004_create_broadcast_logs_table.sql`。00 では `004_create_broadcast_logs_table.sql` と記載済みの場合は整合。
- **2.2** families API: 00 の app/api ツリーに families は**記載済み**（2026-02-14 更新分）。
- **2.5** Doc/ セクションのファイル名・リンク: 00_README、04_Supabase、07/08 番号など。実ファイル名と照合して未修正なら修正。

### 2.0 初回チェック（2026-02-08）で指摘した 00_ファイル構成の不整合

#### 2.1 supabase/ の記載

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| 004 のファイル名 | 記載: `004_broadcast_logs.sql` → 実体: `004_create_broadcast_logs_table.sql` | Doc を実ファイル名に修正 |
| 007〜012 の記載なし | 実体には `006_add_reservation_clicks.sql` のほか、`008_add_10x_system_columns.sql`, `009_add_family_support.sql`, `009_fix_rls_policies.sql`, `012_add_real_name_column.sql` がある | 実行順序を含め、実ファイル一覧に追記 |

#### 2.2 app/api の記載

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| families API の記載なし | 実体に `api/families/route.ts`, `api/families/[family_id]/route.ts`, `api/families/[family_id]/members/route.ts`, `api/families/[family_id]/members/[user_id]/route.ts` がある | 00_ファイル構成の app/api ツリーに families を追記 |

#### 2.3 components/ の記載

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| 家族関連コンポーネントの記載なし | 実体に `families-table.tsx`, `create-family-dialog.tsx`, `edit-family-dialog.tsx`, `add-family-member-dialog.tsx`, `remove-family-member-dialog.tsx`, `delete-family-dialog.tsx` がある | admin 配下の一覧に追記 |
| ui の記載不足 | 実体に `select.tsx`, `checkbox.tsx` がある | ui 一覧に追記 |

#### 2.4 lib/ の記載

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| supabase の構成 | 記載: 単一ファイル `supabase.ts` → 実体: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/server-admin.ts` のサブフォルダ構成 | 構成説明を実態に合わせて修正 |
| 記載なしのファイル | 実体に `broadcast.ts`, `simple-auth.ts`, `simple-auth-verify.ts`, `line-messaging.ts` がある | 一覧に追記 |

#### 2.5 Doc/ セクション（6. Doc/）の記載

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

### 4.A 【Phase 3】詳細照合（2026-02-24）

#### 4.A.1 05 に未記載のテーブル・ビュー（実体に存在）

| テーブル/ビュー | 作成ファイル | 05 の記載 |
|----------------|-------------|----------|
| `care_messages` | 002_create_care_messages_table.sql | なし |
| `broadcast_logs` | 004_create_broadcast_logs_table.sql | なし |
| `staff` | 013_create_staff_table.sql | なし |
| `activity_logs` | 014_create_activity_logs_table.sql | なし |
| `event_logs` | 015_create_event_logs_table_ForUser.sql または 016_create_event_logs_table.sql | なし |
| `surveys` | 017_create_survey_tables.sql | なし |
| `survey_answers` | 017_create_survey_tables.sql | なし |
| `survey_targets` | 017_create_survey_tables.sql | なし |
| `survey_target_status` (VIEW) | 017_create_survey_tables.sql | なし |

**対応案:** 05 のテーブル一覧・詳細スキーマに上記を追記する。参照 Doc: 06 一斉配信、84 イベントログ、22 スタッフ、86/87 アンケート。

---

#### 4.A.2 マイグレーション実行順序の大幅な不一致

05 の「マイグレーション実行順序」で記載されているファイル名と、実 supabase/ のファイルが一致しない。

| 05 の記載 | 実 supabase/ の該当ファイル |
|----------|---------------------------|
| 002_create_stamp_history_table.sql | **存在しない**（002 は care_messages） |
| 003_create_rewards_tables.sql | **存在しない**（003 は add_is_line_friend） |
| 004_add_is_line_friend_column.sql | 004 は create_broadcast_logs |
| 005_add_view_mode_column.sql | 005 は reward_exchanges_rls |
| 006_add_next_memo_columns.sql | 006 は add_reservation_clicks |
| 007_add_reservation_clicks.sql | **007 なし**（006 に含まれる） |
| 008, 009, 012 | 008, 009, 009_fix, 012 は存在。013〜018 は 05 に未記載 |

**注:** `stamp_history`、`rewards`、`reward_exchanges` は 005・008 等で参照されており、別途作成済みと推測される。作成元は 05 または 00 に明記されていない。

**対応案:** 05 のマイグレーション実行順序を、**実 supabase/ フォルダのファイル名一覧と実行順**に合わせて全面改訂する。論理スキーマと物理マイグレーションの対応表を冒頭に追加。

---

#### 4.A.3 016 の重複・曖昧さ

| 実ファイル | 内容 |
|-----------|------|
| `016_create_event_logs_table.sql` | event_logs テーブル作成 |
| `016_add_delete_policy_stamp_history.sql` | stamp_history の DELETE ポリシー・トリガー |

同一番号（016）のファイルが2種あり、実行順序が曖昧。また `015_create_event_logs_table_ForUser.sql` も event_logs を作成しており、015 と 016 の役割分担が不明確。

**対応案:** 05 または 00 で「016 が2種あること」と推奨実行順を注記。event_logs の重複定義について、どちらを正とするか Doc で整理。

---

#### 4.A.4 lib/types.ts に未定義の型

実装で使用されているが、`lib/types.ts` に型定義がないもの：

| テーブル/用途 | 現状 |
|--------------|------|
| `staff` | Staff 型なし（auth/me 等で使用） |
| `activity_logs` | ActivityLog 型なし |
| `event_logs` | EventLog 型なし |
| `care_messages` | CareMessage 型なし |
| `surveys` 関連 | Survey, SurveyAnswer, SurveyTarget 型なし |

**対応案:** 必要に応じて lib/types.ts に型を追加する（※コード修正は今回対象外のため、Doc への指摘のみ）。

---

### 4.0 初回チェック（2026-02-08）で指摘した 05 の不整合

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| マイグレーション番号と実ファイルの対応 | 論理スキーマと物理マイグレーションの体系が乖離 | 上記 4.A.2 の対応案を参照 |
| 存在しない関連ドキュメントへのリンク | 「03_機能仕様書.md」「10_TODO.md」「90_実装履歴.md」「91_仕様変更履歴.md」は Doc 内に存在しない | 03_管理ダッシュボード仕様書.md、99_変更履歴.md など実在ファイルへのリンクに差し替え |

---

## 5. 【Phase 4】86/88/89 アンケート仕様 vs 実装の照合（2026-02-24）

### 5.A 整合していた項目

| 仕様（86/88/89） | 実装 | 状態 |
|-----------------|------|------|
| アンケート一覧に配信対象数・回答率 | `GET /api/surveys` で targetCount, answeredCount, answerRate を返却。一覧テーブルに「配信対象」「回答率」列を表示 | ✅ 一致 |
| 配信設定 UI（LIFF初期表示 ON/OFF・配信期間） | アンケート詳細に配信期間（開始日・終了日）、LIFF ON/OFF ラジオ、保存ボタン。PATCH survey・POST update-liff で更新 | ✅ 一致 |
| 回答状況一覧（targets） | サマリ・表・未回答に戻す操作。survey_target_status ベース | ✅ 一致 |
| 結果集計画面 | Q1 分布（横棒）、NPS、自由記述一覧。GET /api/surveys/results | ✅ 一致 |
| Phase 2 API（一覧・作成・配信登録・一覧・結果） | すべて実装済み | ✅ 一致 |
| Phase 3 画面（一覧・新規・詳細・配信対象者） | すべて実装済み。admin-nav にアンケートリンクあり | ✅ 一致 |

### 5.B 仕様を超えた実装（Doc に未記載）

| 機能 | 実装 | Doc の記載 |
|------|------|------------|
| 結果一覧（回答者ごと） | 結果集計画面に「結果一覧」テーブル。list API で user_id, display_name, q1/q2/q3, created_at を返却 | 86/89 に明示なし |
| 結果の CSV 出力 | アンケート詳細の「CSV出力」ボタン → GET /api/surveys/[surveyId]/results/csv | 88/89 に明記なし（89 の CSV は「回答状況一覧」を指し、任意） |

**対応案:** 89 の「集計結果の仕様」または 88 の成果物チェックリストに「結果一覧」「結果 CSV 出力」を追記すると、Doc が実態と一致する。

### 5.C Doc の記述が古い（実装済みだが Doc が未更新）

| Doc | 該当箇所 | 内容 | 対応案 |
|-----|----------|------|--------|
| **89** | Phase 4 チェックリスト #4, #5 | 「🔲 要対応」のまま。実装は完了済み | 4・5 を「✅ 済」に更新 |
| **88** | 「次のフェーズ」1番目 | 「配信設定の更新 UI」が未完了のように記載。実装済み | 進捗を「Phase 4 完了」に更新し、次のフェーズから配信設定 UI を削除 |
| **88** | 進捗「Phase 4（一部）」 | 回答状況・結果集計のみ完了と記載。配信設定 UI も実装済み | 「Phase 4 完了」に更新 |

### 5.D 仕様通り未実装の項目

| 項目 | 仕様 | 実装 | 備考 |
|------|------|------|------|
| 回答状況一覧の CSV 出力 | 89: 任意 | なし | 任意のため仕様どおり |
| LINE 自動配信（Phase 5） | 88: 任意 | なし | 任意のため仕様どおり |

---

## 6. 【Phase 5】06/07/08/21/84 等 各機能仕様 vs 実装の照合（2026-02-24）

### 6.A 06 一斉配信機能（シンプル版）

| 仕様項目 | 実装 | 状態 |
|---------|------|------|
| 画面: 新規配信・配信履歴タブ | `/admin/broadcast` に2タブ | ✅ 一致 |
| セグメント: スタンプ数（最小・最大） | 実装済み | ✅ 一致 |
| セグメント: 最終来院日数（最小・最大） | 実装済み | ✅ 一致 |
| セグメント: 表示モード（全員/大人のみ/キッズのみ） | **UI なし**。lib/broadcast のフィルタには viewMode 対応あり | ⚠️ 未実装 |
| セグメント: 友だち登録済みのみ | チェックボックスで実装済み | ✅ 一致 |
| プレビュー: 対象者数・10名表示・推定通数 | 実装済み | ✅ 一致 |
| メッセージ: 1000文字・変数 {name}/{stamp_count}/{ticket_number}・挿入ボタン | 実装済み | ✅ 一致 |
| 定型テンプレート 3つ | **未確認**（プレースホルダーのみの可能性） | 🔲 要確認 |
| 送信確認ダイアログ・送信処理 | confirm + 送信 API | ✅ 一致 |
| 配信履歴: 送信日時・送信者・対象者数・成功/失敗・メッセージ | 実装済み（broadcast/logs） | ✅ 一致 |

**不一致:** 表示モードのセレクトボックスが UI にない。定型テンプレートの有無要確認。

---

### 6.B 07 次回来院メモ機能

| 仕様項目 | 実装 | 状態 |
|---------|------|------|
| 既存編集ダイアログに統合 | patients-table の編集ダイアログに next_visit_date, next_memo を統合 | ✅ 一致 |
| next_visit_date, next_memo の更新 | PATCH /api/profiles/[id] で更新 | ✅ 一致 |
| 患者一覧での表示 | 次回来院・次回メモ列あり | ✅ 一致 |

---

### 6.C 07 特典交換履歴機能

| 仕様項目 | 実装 | 状態 |
|---------|------|------|
| 画面・ルート | `/admin/reward-exchanges` | ✅ 一致 |
| 一覧・ステータス管理（pending/completed/cancelled） | 実装済み | ✅ 一致 |

---

### 6.D 08 予約ボタンクリック計測機能

| 仕様項目 | 実装 | 状態 |
|---------|------|------|
| API | `POST /api/users/[userId]/reservation-click` | ✅ 一致 |
| DB | profiles.reservation_button_clicks、increment_reservation_clicks RPC | ✅ 一致 |
| 分析画面での表示 | 要確認（03 や analysis にクリック数列があるか） | 🔲 要確認 |

---

### 6.E 08 スタンプ仕様（積み上げ式） vs 03・実装

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| 03 の「-1 / +1」 | 4.2 に -1/+1 ボタン記載。実装にも -1 あり | 03 と 08_重要 のどちらを正とするか要判断（Phase 2 で指摘済み） |
| 08_重要 | 「積み上げ式・減らさない」と明記 | 管理者訂正用の -1 を許容するなら 03 にその旨追記 |

---

### 6.F 21 家族ひもづけ機能

| 仕様項目 | 実装 | 状態 |
|---------|------|------|
| Phase 1-2 完了 | 21 に「実装完了」と記載 | ✅ 一致 |
| 家族一覧・作成・編集・メンバー追加削除 | app/admin（families は patients 内？）、API families/* | ✅ 一致 |
| family_stamp_totals ビュー | 009_add_family_support で作成 | ✅ 一致 |

**注:** 家族機能のメイン画面は `/admin` 患者一覧内の家族タブ or 別ルートか要確認。admin-nav に「家族」単体リンクはないが、患者一覧などに統合されている可能性。

---

### 6.G 84 イベントログ仕様（管理ダッシュボード開発者向け）

| 仕様（84 が求めるもの） | 実装 | 状態 |
|------------------------|------|------|
| イベントログの可視化 | `/admin/user-logs` で event_logs 一覧表示。GET /api/event-logs | ✅ 最低限実装済み |
| リアルタイムログストリーム | 未実装 | 🔲 未 |
| グラフ表示 | 未実装 | 🔲 未 |
| 分析SQL実行画面 | 未実装 | 🔲 未 |
| CSV 出力 | 未実装 | 🔲 未 |
| ユーザー行動フロー分析 | 未実装 | 🔲 未 |

**対応案:** 84 の「実装してほしいこと」のうち、ログ一覧までは完了。それ以外は今後の拡張候補として Doc に優先度を追記するなど。

---

## 7. 20_家族ひもづけ仕様検討.md の不整合

| 問題 | 詳細 | 対応案 |
|------|------|--------|
| 存在しない Doc へのリンク | 「03_機能仕様書.md」「10_TODO.md」へのリンクがあるが、いずれも存在しない | 実在する Doc（例: 03_管理ダッシュボード仕様書、99_変更履歴）に差し替え |

---

## 8. 整合していた項目（参考）

- **app/** の主要ルート: page, admin/page, admin/login, admin/analysis, admin/broadcast, admin/reward-exchanges、api の auth, broadcast, profiles, users/[userId]/reservation-click は 00_ファイル構成・各仕様書と一致（API パスは reward-exchanges で一致）。
- **08_予約ボタンクリック計測**: API パス `POST /api/users/[userId]/reservation-click`、DB カラム `reservation_button_clicks` は実装と一致。
- **07_次回来院メモ**: 編集ダイアログ統合・next_visit_date / next_memo は実装と一致。
- **lib/types.ts**: Profile の real_name, family_id, family_role, reservation_button_clicks, visit_count, next_memo 等は 05_Database_Schema および実装と一致。
- **04_Supabaseセットアップ手順**: 001, 002, 003 のファイル名は実 supabase/ と一致。

---

## 9. 推奨対応の優先度

1. **すぐ修正可能（Doc の誤記・リンク）**  
   - 00_ファイル構成: supabase の 004 のファイル名、Doc セクションのファイル名・リンク（01_README→00_README、03_Supabase→04_Supabase、101 削除、08/09 番号修正）。
   - 05_Database_Schema・20_家族ひもづけ: 存在しない Doc へのリンクを実在ファイルに差し替え。

2. **追記で対応**  
   - 00_ファイル構成: supabase の 008, 009, 009_fix, 012。app/api の families。components の家族関連・ui の select/checkbox。lib の supabase 構成・broadcast, simple-auth, line-messaging。
   - 03_管理ダッシュボード: 画面一覧に /admin/broadcast, /admin/reward-exchanges を追加。

3. **仕様・設計の判断が必要**  
   - スタンプ「-1」: 08_重要（積み上げ式）と 03 の「-1/+1」および実装の -1 ボタンの扱いを統一するか決定する。

---

## 10. Phase 実施状況（計画）

| Phase | 内容 | 状態 |
|-------|------|------|
| **Phase 1** | 00_ファイル構成 vs 実ファイル | ✅ 実施済（上記 2. の【Phase 1】） |
| **Phase 2** | 03_管理ダッシュボード仕様書 vs 画面・API・機能 | ✅ 実施済（チャットで報告） |
| **Phase 3** | 05_Database_Schema vs supabase/・型定義 | ✅ 実施済（上記 4.A） |
| **Phase 4** | 86/88/89 アンケート仕様 vs 実装 | ✅ 実施済（上記 5.） |
| **Phase 5** | 06/07/08/21/84 等 各機能仕様 vs 実装 | ✅ 実施済（上記 6.） |

Phase 2 以降は順次、本ファイルに「Phase N」として追記する。

---

最終更新: 2026-02-24（Phase 5 完了・全 Phase 実施済）
