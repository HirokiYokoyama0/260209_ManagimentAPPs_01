# Supabase セットアップ手順

つくばホワイト歯科 管理ダッシュボードで使用するSupabaseデータベースのセットアップ手順です。

---

## 📋 実施する手順の概要

1. Supabase プロジェクトの作成（初回のみ）
2. データベーステーブルの作成（SQL実行）
3. 環境変数の設定
4. 接続テストの実行

---

## ステップ1: Supabase プロジェクトの準備

### 1-1. Supabase にアクセス

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. アカウントにログイン（未登録の場合は新規登録）

### 1-2. プロジェクトの選択または作成

- **既存プロジェクトがある場合**: プロジェクト「TsukubaDental」などを選択
- **新規プロジェクトの場合**:
  1. 「New Project」をクリック
  2. プロジェクト名を入力（例: TsukubaDental）
  3. Database Password を設定（安全な場所に記録）
  4. Region を選択（日本の場合は「Northeast Asia (Tokyo)」推奨）
  5. 「Create new project」をクリック

---

## ステップ2: データベーステーブルの作成

### 2-1. SQL Editor を開く

1. 左サイドバーの **「SQL Editor」** をクリック
2. **「New query」** で新規クエリを開く

### 2-2. profiles テーブルの作成

`supabase/001_create_profiles_table.sql` の内容を実行します。

#### SQL内容

```sql
-- ============================================
-- つくばホワイト歯科 LINEミニアプリ
-- プロファイルテーブル作成スクリプト
-- ============================================

-- プロファイルテーブルの作成
CREATE TABLE IF NOT EXISTS profiles (
  -- 主キー: LINEのユーザーID (Uxxxxxxxxxxxx 形式) を直接格納
  id TEXT PRIMARY KEY,

  -- LINEユーザーID（冗長だが将来の拡張性のため保持）
  line_user_id TEXT UNIQUE NOT NULL,

  -- ユーザー表示名
  display_name TEXT,

  -- プロフィール画像URL
  picture_url TEXT,

  -- スタンプ数（来院回数）
  stamp_count INTEGER DEFAULT 0,

  -- 診察券番号（任意）
  ticket_number TEXT,

  -- 最終来院日
  last_visit_date TIMESTAMPTZ,

  -- 作成日時
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 更新日時
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- インデックスの作成
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id
  ON profiles(line_user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_last_visit_date
  ON profiles(last_visit_date);

-- ============================================
-- Row Level Security (RLS) の設定
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "allow_public_insert"
  ON profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_public_update"
  ON profiles
  FOR UPDATE
  USING (true);
```

#### 実行方法
1. 上記のSQLをコピー
2. SQL Editorに貼り付け
3. 右下の **「Run」** ボタンをクリック
4. 「Success」と表示されればOK

---

### 2-3. care_messages テーブルの作成

`supabase/002_create_care_messages_table.sql` の内容を実行します。

#### 実行手順
1. SQL Editor で **「New query」** を開く
2. `supabase/002_create_care_messages_table.sql` の内容をコピー＆貼り付け
3. **「Run」** をクリック
4. 「Success」と表示されればOK

※ すでにテーブルがある場合はエラーになることがありますが、そのままでも動作します。

---

### 2-4. is_line_friend カラムの追加（オプション）

管理ダッシュボードで「公式アカ友だち」機能を使う場合、以下を実行します。

#### 実行手順
1. SQL Editor で **「New query」** を開く
2. `supabase/003_add_is_line_friend_to_profiles.sql` の内容をコピー＆貼り付け
3. **「Run」** をクリック

---

## ステップ3: 環境変数の設定

### 3-1. Supabase の接続情報を取得

1. Supabase Dashboard で左サイドバーの **「Settings」** → **「API」** を開く
2. 以下の情報をコピー:
   - **Project URL** (例: `https://xxxxx.supabase.co`)
   - **anon / public key** (例: `eyJhbGciOi...`)

### 3-2. .env.local ファイルに設定

プロジェクトのルートディレクトリにある `.env.local` ファイルを開き、以下を設定します。

```env
# Supabase 接続情報
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# 管理画面認証（任意で変更）
ADMIN_USER=admin
ADMIN_PASSWORD=admin

# Cookie署名用シークレット（本番環境では必須）
AUTH_SECRET=your-random-secret-string-here

# LINE Messaging API（メッセージ送信機能を使う場合）
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
# または長期トークンを使用する場合
LINE_CHANNEL_ACCESS_TOKEN=your-line-access-token
```

**重要**: `.env.local` ファイルは Git にコミットしないでください（`.gitignore` で除外済み）。

---

## ステップ4: 接続テストの実行

### 4-1. 依存関係のインストール

```bash
npm install
```

### 4-2. 接続テストの実行

```bash
npm run test:supabase
```

### 4-3. 期待される結果

```
===========================================
🧪 Supabase 接続テスト
===========================================

📋 環境変数チェック:
  NEXT_PUBLIC_SUPABASE_URL: ✅ 設定済み
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ 設定済み

🔌 接続テスト中...

📊 テスト1: データベース接続確認
  ✅ データベース接続成功！

📝 テスト2: テストデータの挿入
  ✅ テストデータの挿入成功！

📖 テスト3: データの取得
  ✅ データの取得成功！

✏️  テスト4: データの更新（UPSERT）
  ✅ データの更新成功！

🗑️  テスト5: テストデータの削除
  ✅ テストデータの削除成功！

===========================================
🎉 すべてのテストが完了しました！
===========================================
```

---

## ステップ5: テーブル作成の確認

### 方法1: Table Editor で確認

1. Supabase Dashboard の左サイドバーで **「Table Editor」** をクリック
2. `profiles` テーブルと `care_messages` テーブルが表示されていればOK

### 方法2: SQL で確認

SQL Editor で以下を実行:

```sql
-- profiles テーブルの確認
SELECT * FROM profiles LIMIT 5;

-- care_messages テーブルの確認
SELECT * FROM care_messages LIMIT 5;
```

結果が表示されれば（データが0件でも）、テーブルが正常に作成されています。

---

## トラブルシューティング

### ❌ エラー: `relation "profiles" does not exist`

→ ステップ2のSQLが実行されていません。もう一度SQL Editorで実行してください。

### ❌ エラー: `Could not find the 'picture_url' column`

→ テーブルに必要なカラムが不足しています。以下のSQLを実行：

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS picture_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS stamp_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ticket_number TEXT,
  ADD COLUMN IF NOT EXISTS last_visit_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_line_friend BOOLEAN DEFAULT false;
```

### ❌ エラー: `new row violates row-level security policy`

→ RLSポリシーの問題です。以下のSQLで修正：

```sql
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "allow_public_read" ON profiles;
DROP POLICY IF EXISTS "allow_public_insert" ON profiles;
DROP POLICY IF EXISTS "allow_public_update" ON profiles;

-- 新しいポリシーを作成
CREATE POLICY "allow_public_read"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "allow_public_insert"
  ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_public_update"
  ON profiles FOR UPDATE USING (true);
```

### ⚠️ 環境変数が設定されていない

`.env.local` ファイルを確認してください。ファイルが存在しない場合は、`.env.example` をコピーして `.env.local` にリネームし、実際の値を設定してください。

---

## 完了チェックリスト

実施できたらチェックを入れてください：

- [ ] Supabase プロジェクトを作成または選択
- [ ] SQL Editorで `001_create_profiles_table.sql` を実行
- [ ] SQL Editorで `002_create_care_messages_table.sql` を実行
- [ ] SQL Editorで `003_add_is_line_friend_to_profiles.sql` を実行（オプション）
- [ ] `.env.local` に Supabase の接続情報を設定
- [ ] `npm run test:supabase` でテストが成功
- [ ] Table Editor で `profiles` と `care_messages` テーブルを確認

すべてチェックできたら、Supabaseセットアップ完了です！

---

## 参考: テーブル構造

### profiles テーブル

| カラム名 | 型 | 説明 |
|---------|---|------|
| `id` | TEXT | 主キー（LINEユーザーID） |
| `line_user_id` | TEXT | LINEユーザーID（冗長だが将来用） |
| `display_name` | TEXT | LINEの表示名 |
| `picture_url` | TEXT | プロフィール画像URL |
| `stamp_count` | INTEGER | スタンプ数（来院回数） |
| `ticket_number` | TEXT | 診察券番号（任意） |
| `last_visit_date` | TIMESTAMPTZ | 最終来院日 |
| `is_line_friend` | BOOLEAN | 公式アカウント友だち登録フラグ |
| `view_mode` | TEXT | 表示モード（adult / kids） |
| `created_at` | TIMESTAMPTZ | 作成日時 |
| `updated_at` | TIMESTAMPTZ | 更新日時 |

### care_messages テーブル

| カラム名 | 型 | 説明 |
|---------|---|------|
| `id` | UUID | 主キー |
| `profile_id` | TEXT | 送信先患者ID（profiles.id への外部キー） |
| `message` | TEXT | メッセージ内容 |
| `sent_at` | TIMESTAMPTZ | 送信日時 |
| `created_at` | TIMESTAMPTZ | 作成日時 |

---

## 次のステップ

✅ Supabaseセットアップが完了したら、次は [01_クイックスタート.md](01_クイックスタート.md) を参照してアプリケーションを起動してください。

---

最終更新: 2026-02-14
