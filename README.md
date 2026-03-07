# つくばホワイト歯科 管理ダッシュボード

歯科医院向けLINEミニアプリの管理ダッシュボードです。

## 📋 機能

- **患者管理**: LINE友だち登録ユーザーの一覧・詳細表示・編集
- **スタンプ管理**: 来院スタンプの付与・減算・履歴管理
- **家族連携**: 家族グループの作成・管理
- **一斉配信**: LINE公式アカウントからのメッセージ配信
- **特典管理**: スタンプ交換特典の履歴
- **ケア記録**: 歯科治療記録の管理（Phase 3）
- **アンケート**: 患者アンケートの作成・結果集計

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15 (App Router) + React 19
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **デプロイ**: Vercel
- **テスト**: Playwright

## 📁 プロジェクト構造

```
.
├── app/                    # Next.js App Router
│   ├── admin/              # 管理画面ページ
│   ├── api/                # APIエンドポイント
│   └── layout.tsx          # ルートレイアウト
├── components/             # Reactコンポーネント
│   ├── admin/              # 管理画面用コンポーネント
│   └── ui/                 # shadcn/ui コンポーネント
├── lib/                    # ユーティリティ・ヘルパー
│   ├── supabase/           # Supabase クライアント
│   └── types.ts            # 型定義
├── supabase/               # Supabaseマイグレーション
│   ├── 001_*.sql           # データベーススキーマ
│   ├── 019_*.sql           # ケア記録機能（最新）
│   └── seed.sql            # シードデータ
├── Doc_dashboard/          # 開発ドキュメント
│   ├── 00_README.md        # ドキュメント索引
│   ├── 05_Database_Schema.md
│   ├── 41_ケア記録機能.md
│   └── 42_ケア記録機能_LIFF開発者向け.md
└── tests/                  # E2Eテスト（Playwright）
```

## 🚀 セットアップ

### 1. 環境変数の設定

`.env.example`を`.env.local`にコピーして編集：

```bash
cp .env.example .env.local
```

`.env.local`に以下を設定：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
LINE_CHANNEL_SECRET=your-channel-secret

# LINE LIFF
NEXT_PUBLIC_LIFF_ID=your-liff-id
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabaseマイグレーション実行

Supabase Dashboardの SQL Editor で、`supabase/`ディレクトリ内のマイグレーションファイルを順番に実行：

```
001_create_profiles_table.sql
002_create_stamp_history_table.sql
...
019_create_dental_records_table.sql
```

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス可能

## 📊 データベース

詳細は [Doc_dashboard/05_Database_Schema.md](Doc_dashboard/05_Database_Schema.md) 参照。

### 主要テーブル

- `profiles` - ユーザープロフィール
- `stamp_history` - スタンプ取得履歴
- `families` - 家族グループ
- `patient_dental_records` - 歯科ケア記録（Phase 3）
- `staff` - スタッフアカウント
- `activity_logs` - スタッフ操作ログ

## 🧪 テスト

```bash
# Playwrightテスト実行
npm run test

# UIモードでテスト
npm run test:ui
```

## 📦 デプロイ

### Vercelへのデプロイ

1. Vercelプロジェクトを作成
2. 環境変数を設定（`.env.local`の内容）
3. `main`ブランチにpushで自動デプロイ

```bash
git add .
git commit -m "feat: ケア記録機能実装"
git push origin main
```

## 📚 ドキュメント

- [クイックスタート](Doc_dashboard/02_クイックスタート.md)
- [管理ダッシュボード仕様書](Doc_dashboard/03_管理ダッシュボード仕様書.md)
- [Database Schema](Doc_dashboard/05_Database_Schema.md)
- [ケア記録機能](Doc_dashboard/41_ケア記録機能.md)
- [LIFF開発者向け仕様](Doc_dashboard/42_ケア記録機能_LIFF開発者向け.md)

## 🔐 セキュリティ

- Supabase Row Level Security (RLS) 有効
- 管理画面は認証必須（Supabase Auth）
- APIエンドポイントは service_role キー使用
- 環境変数は`.env.local`で管理（Gitに含めない）

## 📝 ライセンス

プライベートプロジェクト

## 👥 開発者

- Claude Code
- つくばホワイト歯科

---

**最終更新:** 2026-03-07
