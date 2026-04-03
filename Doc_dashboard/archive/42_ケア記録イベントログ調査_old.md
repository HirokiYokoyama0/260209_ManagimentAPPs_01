# ケア記録イベントログ調査

**日時:** 2026-03-07
**問題:** ケア記録関連のイベントログでユーザー・診察券情報が取得できない

## 🔍 問題の詳細

### 症状

管理ダッシュボードのユーザーログ画面で以下のイベントが記録されているが、ユーザー情報が表示されない：

- `care_record_page_view` - ケア記録ページ閲覧
- `odontogram_view` - 歯並び図閲覧

**表示状態:**
- ユーザー: `—`
- 氏名: `—`
- 診察券: `—`

### 原因分析

#### 1. データフロー確認

```
LIFFアプリ → event_logs テーブル → APIエンドポイント → 管理画面
```

#### 2. APIエンドポイント（`/api/event-logs`）の実装

✅ **正常**
- `event_logs`テーブルから`user_id`を取得
- `user_id`が存在する場合、`profiles`テーブルをJOINして情報を取得
- マッピング処理は正しく実装されている

```typescript
// app/api/event-logs/route.ts
const { data: rows, error } = await supabase
  .from("event_logs")
  .select("id, user_id, event_name, source, metadata, created_at")
  .order("created_at", { ascending: false })
  .range(offset, offset + limit - 1);

const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))] as string[];
if (userIds.length > 0) {
  const { data: profileList } = await supabase
    .from("profiles")
    .select("id, display_name, real_name, ticket_number")
    .in("id", userIds);
  // マッピング処理...
}
```

#### 3. **問題の原因**

❌ **LIFF側の実装で`user_id`が送信されていない**

考えられる原因：
1. LIFFアプリでイベント送信時に`user_id`を含めていない
2. `user_id`が`null`で送信されている
3. 存在しない`user_id`が送信されている

### 確認すべき項目

#### Supabaseデータベースで確認

```sql
-- event_logsテーブルの最新データを確認
SELECT
  id,
  user_id,
  event_name,
  source,
  metadata,
  created_at
FROM event_logs
WHERE event_name IN ('care_record_page_view', 'odontogram_view')
ORDER BY created_at DESC
LIMIT 10;
```

**確認ポイント:**
- `user_id`カラムに値が入っているか？
- `user_id`が`NULL`になっていないか？
- `user_id`がprofilesテーブルに存在するか？

#### profilesテーブルと照合

```sql
-- user_idがprofilesに存在するか確認
SELECT
  e.id,
  e.user_id,
  e.event_name,
  p.display_name,
  p.real_name,
  p.ticket_number
FROM event_logs e
LEFT JOIN profiles p ON e.user_id = p.id
WHERE e.event_name IN ('care_record_page_view', 'odontogram_view')
ORDER BY e.created_at DESC
LIMIT 10;
```

## 📝 LIFF開発者への確認事項

### 1. イベントログ送信時のコード確認

LIFFアプリでイベントログを送信する際、以下のように**user_idを必ず含める**必要があります：

```typescript
// ❌ 間違い: user_idが含まれていない
await supabase
  .from('event_logs')
  .insert({
    event_name: 'care_record_page_view',
    source: 'direct',
    metadata: {
      page_path: '/care',
      timestamp: Date.now()
    }
  });

// ✅ 正しい: user_idを含める
const { data: { user } } = await supabase.auth.getUser();

await supabase
  .from('event_logs')
  .insert({
    user_id: user?.id,  // ← これが必須！
    event_name: 'care_record_page_view',
    source: 'direct',
    metadata: {
      page_path: '/care',
      timestamp: Date.now()
    }
  });
```

### 2. 認証状態の確認

LIFFアプリで以下を確認：

```typescript
// Supabase認証が正しく行われているか
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id); // user_idが取得できているか確認

// user_idが取得できていない場合、認証が必要
if (!user) {
  // LINE IDトークンでSupabaseにログイン
  const idToken = liff.getIDToken();
  await supabase.auth.signInWithIdToken({
    provider: 'line',
    token: idToken
  });
}
```

### 3. イベントログ送信の共通関数化（推奨）

```typescript
// lib/analytics.ts (例)
export async function trackEvent(
  eventName: string,
  metadata?: Record<string, any>,
  source: string = 'direct'
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('User not authenticated, event not tracked');
      return;
    }

    await supabase.from('event_logs').insert({
      user_id: user.id,  // ← 必ず含める
      event_name: eventName,
      source: source,
      metadata: metadata || null
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// 使用例
trackEvent('care_record_page_view', {
  page_path: '/care',
  referrer: document.referrer
});
```

## 🔧 修正手順

### LIFF開発者側

1. **イベントログ送信箇所をすべて確認**
   - `care_record_page_view`
   - `odontogram_view`
   - その他のケア記録関連イベント

2. **user_idを含めるように修正**
   - 現在のコードで`user_id`が欠けている箇所を修正
   - 認証状態を確認してから送信

3. **テスト**
   - 修正後、実際にLIFFアプリでケア記録ページを開く
   - 管理ダッシュボードでユーザー情報が表示されるか確認

### ダッシュボード側（必要に応じて）

現状のAPIは正しく実装されているため、**修正不要**。
ただし、デバッグ用に以下を追加することも検討：

```typescript
// app/api/event-logs/route.ts に追加
console.log('[DEBUG] Total logs:', logs.length);
console.log('[DEBUG] Logs with user_id:', logs.filter(l => l.user_id).length);
console.log('[DEBUG] User IDs:', userIds);
console.log('[DEBUG] Profile map size:', Object.keys(profileMap).length);
```

## ✅ 解決の確認

修正後、以下が表示されることを確認：

- ✅ ユーザー: `横山浩紀` または `Uxxxx...`
- ✅ 氏名: `横山浩紀本名` （設定している場合）
- ✅ 診察券: `123459`

## 参考資料

- [32_イベントログ設計_ユーザ操作.md](32_イベントログ設計_ユーザ操作.md)
- [05_Database_Schema.md](05_Database_Schema.md) - event_logsテーブル定義

---

**最終更新:** 2026-03-07
**ステータス:** 🔍 調査中 - LIFF開発者に確認依頼
