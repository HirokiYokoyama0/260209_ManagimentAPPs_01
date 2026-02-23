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

## 6. 参考

- ローカルでの実行: [実行コマンド.md](実行コマンド.md)
- 環境変数一覧（ローカル用）: `.env.example` をコピーして `.env.local` を作成

---

**最終更新:** 2026-02-23
