# 45_患者削除機能_LIFF開発者向け

**作成日:** 2026-03-07
**最終更新:** 2026-03-07
**対象:** LIFF アプリ開発者
**重要度:** 🚨 高（必須対応）

---

## 📋 目次

1. [概要](#概要)
2. [背景と影響](#背景と影響)
3. [必須実装事項](#必須実装事項)
4. [オンボーディングフローの実装](#オンボーディングフローの実装)
5. [実装サンプルコード](#実装サンプルコード)
6. [エラーハンドリング](#エラーハンドリング)
7. [テスト項目](#テスト項目)
8. [注意事項](#注意事項)

---

## 概要

### 📢 重要なお知らせ

管理ダッシュボードに**患者削除機能**が追加されます。

この機能により、患者情報が Supabase の `profiles` テーブルから**完全に削除**される可能性があります。

**LIFF アプリ側で必須の対応:**
- 削除された患者が再度アクセスした場合、**新規ユーザー**として扱う
- オンボーディング画面を実装し、新規登録フローを提供する

---

## 背景と影響

### 患者削除の動作

管理ダッシュボードで患者を削除すると、以下のデータが**完全に削除**されます：

| テーブル | 削除内容 | 影響 |
|---------|---------|------|
| `profiles` | プロフィール情報 | **完全削除** |
| `stamp_history` | スタンプ履歴 | **完全削除**（CASCADE） |
| `reward_exchanges` | 特典交換履歴 | **完全削除**（CASCADE） |
| `patient_dental_records` | ケア記録 | **完全削除**（CASCADE） |
| `families` | 家族情報（単身の場合） | **完全削除** |
| `event_logs` | ユーザー行動ログ | **残る**（user_id は孤立データとなる） |

### LIFF アプリへの影響

削除された患者が再度 LIFF アプリにアクセスすると：

1. `profiles` テーブルにデータが存在しない
2. LINE User ID は同じだが、プロフィール情報がない状態
3. **新規ユーザー**として扱う必要がある

**対応が必須:**
- アプリ起動時に `profiles` の存在確認を行う
- 存在しない場合、オンボーディング画面へリダイレクト
- 新規登録フローを実装する

---

## 必須実装事項

### ✅ 実装チェックリスト

- [ ] **アプリ起動時のプロフィール存在確認**
- [ ] **オンボーディング画面の実装**
- [ ] **新規 `profiles` レコードの作成**
- [ ] **新規 `families` レコード（単身家族）の作成**
- [ ] **エラーハンドリング（作成失敗時）**
- [ ] **テストケースの実施**

---

## オンボーディングフローの実装

### フローチャート

```
[LIFF アプリ起動]
   ↓
[LIFF 初期化]
   ↓
[LINE ログイン確認]
   ↓
[LINE User ID 取得]
   ↓
[Supabase で profiles.id = LINE User ID を検索]
   ↓
┌─────────────────┐
│ 存在する？      │
└─────────────────┘
   ↓ YES          ↓ NO
[ホーム画面]   [オンボーディング画面]
                    ↓
               [新規 families 作成]
                    ↓
               [新規 profiles 作成]
                    ↓
               [ホーム画面へリダイレクト]
```

---

## 実装サンプルコード

### 1. アプリ起動時の存在確認

**ファイル:** `app/layout.tsx` または `app/page.tsx`

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import liff from "@line/liff";
import { createClient } from "@/lib/supabase/client";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const initLiff = async () => {
      try {
        // LIFF 初期化
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

        if (!liff.isLoggedIn()) {
          // LINE ログインしていない場合
          liff.login();
          return;
        }

        // LINE プロフィール取得
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;

        // Supabase でプロフィール存在確認
        const supabase = createClient();
        const { data: existingProfile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", lineUserId)
          .single();

        if (error || !existingProfile) {
          // ✅ プロフィールが存在しない → オンボーディングへ
          console.log("Profile not found. Redirecting to onboarding...");
          router.push("/onboarding");
        } else {
          // ✅ プロフィールが存在する → ホーム画面へ
          console.log("Profile found. User is authenticated.");
          // 通常のアプリ起動処理を続行
        }
      } catch (error) {
        console.error("LIFF initialization failed:", error);
      }
    };

    initLiff();
  }, [router]);

  return <>{children}</>;
}
```

---

### 2. オンボーディング画面の実装

**ファイル:** `app/onboarding/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import liff from "@line/liff";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleOnboarding = async () => {
    setLoading(true);

    try {
      // LINE プロフィール取得
      const profile = await liff.getProfile();
      const supabase = createClient();

      // ステップ1: 新規家族を作成（単身家族）
      const { data: newFamily, error: familyError } = await supabase
        .from("families")
        .insert({
          family_name: `${profile.displayName}の家族`,
          representative_user_id: profile.userId,
        })
        .select()
        .single();

      if (familyError) {
        throw new Error(`家族の作成に失敗しました: ${familyError.message}`);
      }

      // ステップ2: 新規プロフィールを作成
      const { error: profileError } = await supabase.from("profiles").insert({
        id: profile.userId,
        line_user_id: profile.userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl,
        family_id: newFamily.id,
        family_role: "parent",
        stamp_count: 0,
        visit_count: 0,
        view_mode: "adult",
      });

      if (profileError) {
        throw new Error(`プロフィールの作成に失敗しました: ${profileError.message}`);
      }

      // ステップ3: イベントログ記録（オプション）
      await supabase.from("event_logs").insert({
        user_id: profile.userId,
        event_name: "user_registered",
        source: "liff_onboarding",
        metadata: {
          display_name: profile.displayName,
          family_id: newFamily.id,
        },
      });

      // 成功メッセージ
      toast.success("登録が完了しました！");

      // ホーム画面へリダイレクト
      router.push("/");
    } catch (error: any) {
      console.error("Onboarding failed:", error);
      toast.error(error.message || "登録に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ようこそ！
          </h1>
          <p className="text-gray-600">
            つくばホワイト歯科のスタンプカードへようこそ。<br />
            アカウントを作成して始めましょう。
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h3 className="font-semibold text-teal-900 mb-2">
              スタンプカードの特典
            </h3>
            <ul className="text-sm text-teal-800 space-y-1">
              <li>✅ 来院ごとにスタンプがたまる</li>
              <li>✅ スタンプで特典と交換できる</li>
              <li>✅ 家族でスタンプを共有できる</li>
              <li>✅ 次回予約の管理が簡単</li>
            </ul>
          </div>

          <Button
            onClick={handleOnboarding}
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {loading ? "登録中..." : "アカウントを作成する"}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            アカウント作成により、
            <a href="/terms" className="underline">利用規約</a>
            および
            <a href="/privacy" className="underline">プライバシーポリシー</a>
            に同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. 既存コードの修正（ホーム画面など）

**ファイル:** `app/page.tsx`（既存のホーム画面）

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import liff from "@line/liff";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // LIFF 初期化（すでに初期化済みの場合はスキップ）
        if (!liff.isInClient() && !liff.isLoggedIn()) {
          await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        }

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        // LINE プロフィール取得
        const lineProfile = await liff.getProfile();
        const supabase = createClient();

        // Supabase からプロフィール取得
        const { data: userProfile, error } = await supabase
          .from("profiles")
          .select("*, families(*)")
          .eq("id", lineProfile.userId)
          .single();

        if (error || !userProfile) {
          // プロフィールが存在しない → オンボーディングへ
          console.warn("Profile not found, redirecting to onboarding");
          router.push("/onboarding");
          return;
        }

        setProfile(userProfile);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (!profile) {
    return null; // リダイレクト中
  }

  return (
    <div>
      <h1>ようこそ、{profile.display_name} さん！</h1>
      <p>スタンプ数: {profile.stamp_count / 10} 個</p>
      {/* 以下、通常のホーム画面 */}
    </div>
  );
}
```

---

## エラーハンドリング

### エラーケースと対応

#### ケース1: プロフィール作成に失敗（重複ID）

**エラー:**
```
duplicate key value violates unique constraint "profiles_pkey"
```

**原因:** 同じ LINE User ID で既に登録済み（削除されていない）

**対応:**
```typescript
if (profileError) {
  if (profileError.code === "23505") {
    // 重複エラー → プロフィールが存在する可能性
    toast.error("アカウントは既に登録されています。");
    router.push("/");
  } else {
    toast.error("登録に失敗しました。もう一度お試しください。");
  }
}
```

---

#### ケース2: 家族作成に失敗

**エラー:**
```
insert or update on table "families" violates foreign key constraint
```

**原因:** ネットワークエラーまたはデータベース接続問題

**対応:**
```typescript
if (familyError) {
  console.error("Family creation failed:", familyError);
  toast.error("家族の作成に失敗しました。ネットワーク接続を確認してください。");
  return;
}
```

---

#### ケース3: ネットワークエラー

**対応:**
```typescript
try {
  // Supabase 処理
} catch (error: any) {
  if (error.message.includes("fetch")) {
    toast.error("ネットワークエラー: インターネット接続を確認してください。");
  } else {
    toast.error("予期しないエラーが発生しました。");
  }
}
```

---

## テスト項目

### ✅ テストケース

#### テスト1: 新規ユーザーのオンボーディング
**手順:**
1. 新しい LINE アカウントで LIFF アプリにアクセス
2. オンボーディング画面が表示されることを確認
3. 「アカウントを作成する」をタップ
4. ホーム画面にリダイレクトされることを確認
5. Supabase で `profiles` と `families` が作成されていることを確認

**期待結果:**
- ✅ オンボーディング画面が表示される
- ✅ `profiles` レコードが作成される
- ✅ `families` レコードが作成される（単身家族）
- ✅ `profiles.family_id` に新しい家族IDが設定される
- ✅ ホーム画面が表示され、スタンプ数が 0 個

---

#### テスト2: 削除された患者の再登録
**手順:**
1. 管理ダッシュボードで患者を削除
2. 削除された患者の LINE アカウントで LIFF アプリにアクセス
3. オンボーディング画面が表示されることを確認
4. 再登録を完了
5. ホーム画面が表示されることを確認
6. スタンプ数が 0 個（以前のデータは引き継がれない）

**期待結果:**
- ✅ オンボーディング画面が表示される
- ✅ 新規登録が完了する
- ✅ 以前のスタンプ履歴は引き継がれない（0 個から開始）
- ✅ 新しい家族IDが割り当てられる

---

#### テスト3: 既存ユーザーのアクセス
**手順:**
1. 既存の登録済みユーザーで LIFF アプリにアクセス
2. オンボーディング画面が**表示されない**ことを確認
3. ホーム画面が直接表示されることを確認

**期待結果:**
- ✅ オンボーディング画面はスキップされる
- ✅ ホーム画面が表示される
- ✅ スタンプ数が正しく表示される

---

#### テスト4: ネットワークエラー時の挙動
**手順:**
1. オンボーディング画面で「アカウントを作成する」をタップ
2. ネットワークを切断（機内モード ON）
3. エラーメッセージが表示されることを確認
4. ネットワークを再接続
5. 再試行して成功することを確認

**期待結果:**
- ✅ エラーメッセージが表示される
- ✅ ローディング状態が解除される
- ✅ 再試行が可能

---

## 注意事項

### ⚠️ 重要な制約事項

#### 1. データの復元は不可能
削除された患者が再登録しても、**以前のデータは一切復元されません**。

- ❌ スタンプ履歴
- ❌ 特典交換履歴
- ❌ ケア記録
- ❌ 来院回数

すべて **0 からスタート**します。

---

#### 2. LINE User ID の再利用
削除された患者が再登録すると、**同じ LINE User ID** が再度使用されます。

これにより、`event_logs` テーブルの過去のログとの紐付けが可能です。

**例:**
```sql
-- 削除前のログ
SELECT * FROM event_logs WHERE user_id = 'U123456789';
-- 結果: 過去の行動ログが表示される（ユーザーは削除済みだが、ログは残っている）

-- 再登録後
-- 同じ user_id で新しいログが追加される
```

---

#### 3. 家族情報の引き継ぎ
削除された患者が再登録すると、**新しい単身家族**が作成されます。

以前の家族とは完全に切り離されます。

---

#### 4. オンボーディングの必須化
`profiles` が存在しない場合、**すべての LIFF アプリ機能が利用不可**です。

必ずオンボーディングを完了させる必要があります。

---

### 📝 開発時の推奨事項

#### 1. ローカル開発時のテストユーザー管理
- テストユーザーは管理ダッシュボードから削除可能
- 削除後、再度 LIFF アプリにアクセスしてオンボーディングをテスト

#### 2. エラーログの記録
```typescript
// オンボーディング失敗時、Supabase にエラーログを記録（オプション）
await supabase.from("event_logs").insert({
  user_id: null, // まだ登録されていない
  event_name: "onboarding_failed",
  source: "liff_onboarding",
  metadata: {
    error: error.message,
    line_user_id: profile.userId,
  },
});
```

#### 3. 成功率の監視
オンボーディングの成功率を監視し、エラーが多発する場合は調査が必要です。

```sql
-- オンボーディング成功率
SELECT
  COUNT(*) FILTER (WHERE event_name = 'user_registered') AS success,
  COUNT(*) FILTER (WHERE event_name = 'onboarding_failed') AS failed,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE event_name = 'user_registered') /
    NULLIF(COUNT(*), 0),
    2
  ) AS success_rate_percent
FROM event_logs
WHERE event_name IN ('user_registered', 'onboarding_failed')
  AND created_at >= NOW() - INTERVAL '7 days';
```

---

## まとめ

### 📌 実装の要点

1. **アプリ起動時に `profiles` の存在確認を必ず行う**
2. **存在しない場合、オンボーディング画面へリダイレクト**
3. **オンボーディングで新規 `families` と `profiles` を作成**
4. **エラーハンドリングを適切に実装**
5. **テストケースをすべて実施**

### 🚀 次のステップ

- [ ] 上記のコードを実装
- [ ] ローカル環境でテスト
- [ ] 管理ダッシュボードと連携テスト
- [ ] 本番環境へのデプロイ

---

## 質問・問題が発生した場合

仕様や実装について不明な点がある場合、以下を確認してください：

1. [44_患者削除機能仕様.md](44_患者削除機能仕様.md) - 詳細な仕様書
2. [05_Database_Schema.md](05_Database_Schema.md) - データベーススキーマ
3. [42_ケア記録機能_LIFF開発者向け.md](42_ケア記録機能_LIFF開発者向け.md) - LIFF アプリの基本構造

---

## 改訂履歴

| 日付 | バージョン | 内容 |
|------|----------|------|
| 2026-03-07 | 1.0 | 初版作成：LIFF 開発者向け患者削除機能の実装ガイド |

---

**作成者:** Claude Code
**最終更新日:** 2026-03-07
