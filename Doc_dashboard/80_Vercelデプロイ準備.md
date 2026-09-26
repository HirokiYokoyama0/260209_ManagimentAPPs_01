# Vercel デプロイ前の準備（GitHub 連携）

**目的:** GitHub → Vercel でデプロイする前に、環境変数と設定を整える。

---

## 1. 環境変数（必須）

Vercel ダッシュボード → プロジェクト → **Settings** → **Environment Variables** で以下を登録する。

| 変数名 | 必須 | 説明 | 備考 |
|--------|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase プロジェクトの URL | 例: `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase の anon（公開）キー | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase の service_role（秘密）キー | care_messages・activity_logs・管理APIで使用。**絶対に公開しない** |
| `AUTH_SECRET` | ✅ 本番 | Cookie 署名用の秘密文字列 | **本番では 32 文字以上のランダム文字列に変更** |
| `ADMIN_USER` | ✅ | 管理画面ログインID（フォールバック用） | スタッフテーブル未登録時のログイン。**本番では強めの値に** |
| `ADMIN_PASSWORD` | ✅ | 管理画面ログインパスワード（フォールバック用） | **本番では強力なパスワードに** |

- **Environment:** 本番なら **Production** にだけ設定。Preview 用に別値が必要なら **Preview** も設定。
- `.env.local` の値をそのまま使う場合は、**本番用に `AUTH_SECRET`・`ADMIN_USER`・`ADMIN_PASSWORD` は必ず変更すること**。

---

## 2. 環境変数（任意）

| 変数名 | 説明 | 未設定時の挙動 |
|--------|------|----------------|
| `NEXT_PUBLIC_LIFF_ID` | LINE LIFF アプリ ID | この管理アプリから LIFF を開かないなら省略可 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API の長期トークン | 個別プッシュ・一斉配信が使えない |
| `LINE_CHANNEL_ID` または `Channel_ID` | LINE チャネル ID | トークン取得に必要（トークン直接指定なら不要） |
| `LINE_CHANNEL_SECRET` または `Channel_secret` | LINE チャネルシークレット | 同上 |

- 一斉配信・個別メッセージ送信を使う場合は、**LINE 系のいずれか**を設定する。

---

## 3. デプロイ前チェックリスト

- [ ] 上記の**必須環境変数**を Vercel に登録した（本番用は強めの値に変更済み）
- [ ] `.env.local` を **Git にコミットしていない**（.gitignore に含まれていることを確認）
- [ ] 本番で使う **Supabase** で、必要なマイグレーションを実行済み（staff, activity_logs, event_logs など）
- [ ] 開発サーバーを**止めた状態**で `npm run build` が成功することをローカルで確認した

---

## 4. Vercel 側の設定（目安）

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`（デフォルトのまま）
- **Output Directory:** デフォルトのまま
- **Install Command:** `npm install`（デフォルトのまま）
- **Root Directory:** リポジトリルートなら空のまま

---

## 5. デプロイ後の確認

1. デプロイされた URL（例: `https://xxx.vercel.app`）にアクセス
2. `/admin/login` で、`ADMIN_USER` / `ADMIN_PASSWORD` でログインできるか確認
3. 患者一覧・スタンプ・スタッフ操作ログなどが表示されるか確認
4. 一斉配信や LINE プッシュを使う場合は、該当機能の動作確認

---

## 6. ログ・監視のための Vercel API アクセス（2026-09-26 追加）

管理ダッシュボード開発者が、**Vercel のデプロイ状態・ビルドログを API 経由で取得**できるようにした。デプロイ確認・障害調査・監視の自動化に使う。

### 6-1. 必要な環境変数（ローカル `.env.local`）

これらは **Vercel ダッシュボードではなく、手元の `.env.local`** に置く（ツール／スクリプトが読む）。

| 変数名 | 説明 | 秘匿 |
|--------|------|------|
| `VERCEL_TOKEN` | Vercel アクセストークン | 🔴 **秘密。コミット禁止** |
| `VERCEL_PROJECT_ID` | プロジェクトID（`prj_Ak8LrHBc7sqiGakebc8PX2SemNtS`） | 公開可 |
| `VERCEL_TEAM_ID` | チームID（`team_DUhSbD5DdTVtG5E0tGFgIpJ2`） | 公開可 |

- `.env.local` は `.gitignore` 済み（`git check-ignore .env.local` で確認可）。**トークンは絶対にコミットしない。**

### 6-2. トークン発行手順

1. https://vercel.com/account/settings/tokens → **Create Token**
2. Scope: `hirokiyokoyama0s-projects`（または Full Account）／ Expiration: 期限付き推奨
3. 発行された文字列を `.env.local` の `VERCEL_TOKEN` に設定

### 6-3. 取得できるもの／できないもの

| 種別 | API | 可否 |
|------|-----|------|
| トークン有効性 | `GET /v2/user` | ✅ |
| デプロイ一覧・状態（READY/ERROR 等） | `GET /v6/deployments?projectId=…&teamId=…` | ✅ |
| ビルドログ（デプロイ単位・失敗調査） | `GET /v3/deployments/{id}/events` | ✅ |
| **ランタイム（リクエスト）ログの過去分** | — | ⚠️ API では直近／ライブ寄りで制約あり |

- ランタイムの**リクエスト単位ログ**（例: 特典重複調査で使う `/api/reward-exchanges` の履歴）を過去に遡って見るなら、**Vercel ダッシュボードの "Copy logs"** が最も確実。継続収集が必要なら **Log Drain** を別途設定する。

### 6-4. 動作確認例（トークン値は出力しない）

```bash
# .env.local の VERCEL_TOKEN を使って、認証と直近デプロイを確認
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID&teamId=$VERCEL_TEAM_ID&limit=5"
```

### 6-5. 疎通確認済み

- **2026-09-26**：アカウント `hirokiyokoyama0` で認証 OK。直近 5 デプロイがすべて `READY`（本番 = 2026-07-19 デプロイ、コミット `b8acd8c` 相当）であることを確認。

---

## 7. 参考

- ローカルでの実行: [実行コマンド.md](実行コマンド.md)
- 環境変数一覧（ローカル用）: `.env.example` をコピーして `.env.local` を作成

---

**最終更新:** 2026-09-26
