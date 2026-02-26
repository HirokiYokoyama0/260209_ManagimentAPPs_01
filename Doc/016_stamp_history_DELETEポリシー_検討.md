# 016_add_delete_policy_stamp_history 検討メモ

**作成日:** 2026-02-24  
**提案元:** LIFFアプリ開発者  
**目的:** RLS で stamp_history の DELETE/UPDATE を許可し、削除時に profiles を再計算するトリガーを追加する。

---

## 1. 提案内容の要約

- `stamp_history` に **DELETE** と **UPDATE** の RLS ポリシーを追加（`USING (true)` = 全員許可）
- **AFTER DELETE** トリガーで、削除されたユーザーの `profiles.stamp_count` / `visit_count` / `last_visit_date` を再計算

---

## 2. ダッシュボードへの影響

| 観点 | 結論 |
|------|------|
| **API の利用有無** | ダッシュボードは **stamp_history を直接触らない**。`/api/profiles/[id]/stamp` と `stamp-set` は **profiles テーブルのみ** UPDATE。 |
| **表示・集計** | 患者一覧・分析・家族合計は **profiles.stamp_count** や **family_stamp_totals ビュー**（profiles 集計）を参照。stamp_history の行数は直接表示していない。 |
| **機能的な破綻** | なし。ポリシー追加・トリガー追加ともに、既存のダッシュボード機能はそのまま動く。 |
| **データの流れ** | LIFF や管理側で **stamp_history の行を削除**すると、トリガーで **profiles が自動更新**される。ダッシュボードは更新後の profiles を表示するだけなので、一貫した表示になる。 |

→ **ダッシュボードへの機能影響は小さい。** 採用してよい。

---

## 3. 指摘事項・修正推奨

### 3.1 トリガー計算式の整合性（要修正）

**008_add_10x_system_columns.sql** の INSERT 用トリガーでは、`stamp_count` を次のように計算している:

```sql
stamp_count = (SELECT COALESCE(MAX(stamp_number), 0) FROM stamp_history WHERE user_id = NEW.user_id)
```

一方、016 案の **DELETE 用トリガー**では:

```sql
stamp_count = (SELECT COALESCE(SUM(amount), 0) FROM stamp_history WHERE user_id = OLD.user_id)
```

- **INSERT** … `MAX(stamp_number)`（累積ポイントの最大値）
- **DELETE** … `SUM(amount)`（付与ポイントの合計）

どちらも「ポイント合計」としては一致するケースが多いが、**定義が異なる**と将来のスロット付与や手動修正で食い違う可能性がある。  
**008 と揃えるため、DELETE トリガーでも `stamp_count` は `MAX(stamp_number)` で再計算する**ことを推奨する。

### 3.2 RLS の緩さ（将来の検討）

- `USING (true)` のため、**anon キー**でも誰でも `stamp_history` の任意行を DELETE/UPDATE できる。
- LIFF は「自分の user_id の行だけ削除」する想定であれば、本来は **自分のデータのみ** に制限した方が安全。
- 現状は「RLS バイパスをやめたい」という目的なら、まずは全員許可で導入し、**本番化や監査要件に合わせて「自分の行のみ」に絞る**方針でよい。

---

## 4. 案の整理（どれにするかは未定）

以下は選択肢。決めているわけではない。

---

### 案A: そのまま採用（LIFF 案を修正せず）

- **ポリシー:** `allow_public_delete` / `allow_public_update`（`USING (true)`）をそのまま追加。
- **トリガー:** `stamp_count = SUM(amount)` のまま。
- **メリット:** LIFF 側の要望どおりで、実装が早い。
- **デメリット:** INSERT トリガー（008）は `MAX(stamp_number)` なので、定義が二つになり、将来のスロット付与などでずれる可能性がある。

---

### 案B: トリガーだけ 008 と統一して採用（いま反映済みの形）

- **ポリシー:** 案A と同じ（全員 DELETE/UPDATE 可）。
- **トリガー:** `stamp_count = MAX(stamp_number)` に変更し、008 の INSERT トリガーと一致させる。
- **メリット:** 履歴の「現在値」の定義が INSERT/DELETE で一つになる。ダッシュボードとの整合性も取りやすい。
- **デメリット:** 特になし（既に 016 の SQL をこの形に修正済み）。

---

### 案C: ポリシーは「サービスロールのみ」、トリガーは 008 と統一

- **ポリシー:** anon では DELETE/UPDATE させない。  
  - 例: ポリシーを付けず、管理側・LIFF バックエンドだけが **service_role** で stamp_history を削除する運用にする。  
  - または「自分の user_id の行だけ削除可」のような RLS を書く（LIFF は anon で「自分」だけ削除可能にできる）。
- **トリガー:** 案B と同様に `MAX(stamp_number)` で統一。
- **メリット:** 不正に誰かの履歴を消されるリスクを減らせる。
- **デメリット:** LIFF から「自分の履歴を削除」するには、anon で「自分の行のみ」ポリシーを用意するか、サーバー経由（service_role）で削除する必要がある。LIFF 開発者と役割のすり合わせが必要。

---

### 案D: 016 は入れない（DELETE は運用で対応）

- **ポリシー:** stamp_history には DELETE/UPDATE を追加しない。
- **トリガー:** 追加しない。
- **運用:** 削除が必要なときは、Supabase ダッシュボードや管理用スクリプトで **service_role** を使って手で削除する。
- **メリット:** RLS を広げないので安全。既存の「履歴は INSERT のみ」の世界を保てる。
- **デメリット:** LIFF から「ユーザーが自分の履歴の取り消し」などをやりにくい。LIFF 開発者の「RLS バイパスをやめたい」という要望には直接は応えられない。

---

## 5. 選ぶときの目安

| 選び方 | おすすめ案 |
|--------|------------|
| LIFF の「削除したい」をすぐ実現したい | 案A または 案B |
| 定義の一貫性も大事にしたい | **案B** |
| セキュリティを強くしたい（anon で全削除は嫌） | 案C |
| いったん変更を入れたくない | 案D |

決めていない前提で、上記を選択肢として共有する用に書いてある。
