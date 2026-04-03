# 有効期限機能実装ガイド - LIFFアプリ開発者への情報共有

**作成日**: 2026-03-28
**対象**: LIFFアプリ開発チーム
**目的**: 特典の有効期限機能の実装方法と管理ダッシュボード側への影響を共有

---

## 📋 現状の実装状況

### ✅ 実装済み

**valid_until カラムの保存**（2026-03-27実装）
- `reward_exchanges.valid_until` に有効期限が記録される
- 計算ロジック（`lib/milestones.ts`）:
  - **歯ブラシ**: 当日限り（翌日0時まで）
  - **POIC**: 5ヶ月間
  - **自費メニュー**: 5ヶ月間

### ❌ 未実装

以下の機能は**まだ実装されていません**：

1. **バックエンドの自動期限切れ処理**
   - `valid_until` を過ぎても `status` は `pending` のまま
   - 自動的に `status = 'expired'` にする処理がない

2. **フロントエンドの期限チェック**
   - LIFFアプリで期限切れを検知して表示する処理がない
   - 期限切れでも「交換する」ボタンが押せてしまう

3. **定期処理（cronジョブ）**
   - 日次バッチなどで期限切れをチェックする仕組みがない

4. **管理ダッシュボードの期限切れ表示**
   - スタッフ側で期限切れを視覚的に判別する表示がない

---

## 🎯 実装方針の提案

### 推奨アプローチ: **フロントエンド + バックエンドの両方で制御**

理由：
- ✅ ユーザー体験向上（リアルタイムで期限切れを表示）
- ✅ データ整合性の確保（バックエンドで最終チェック）
- ✅ cronジョブ不要（処理がシンプル）

---

## 📐 実装方法

### A. LIFFアプリ側（フロントエンド制御）

#### 1. 特典一覧での期限チェック

**ファイル**: `components/(adult)/AdultRewardsPage.tsx` など

```typescript
// reward_exchanges を取得後、有効期限をチェック
const isExpired = (exchange: RewardExchange): boolean => {
  if (!exchange.valid_until) return false; // 無期限
  return new Date(exchange.valid_until) < new Date();
};

// 表示例
{exchanges.map(exchange => (
  <div key={exchange.id}>
    <h3>{exchange.reward_name}</h3>

    {isExpired(exchange) ? (
      <Badge variant="secondary" className="bg-gray-200 text-gray-600">
        有効期限切れ
      </Badge>
    ) : exchange.status === 'pending' ? (
      <>
        <Badge variant="default">未使用</Badge>
        <Button onClick={() => handleExchange(exchange.id)}>
          交換する
        </Button>
        {exchange.valid_until && (
          <p className="text-xs text-gray-500">
            有効期限: {formatDate(exchange.valid_until)}
          </p>
        )}
      </>
    ) : (
      <Badge variant="secondary">使用済み</Badge>
    )}
  </div>
))}
```

#### 2. 日付フォーマット関数

```typescript
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// または相対時間表示
function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const validUntil = new Date(isoString);
  const diffDays = Math.floor((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '期限切れ';
  if (diffDays === 0) return '今日まで';
  if (diffDays === 1) return '明日まで';
  return `あと${diffDays}日`;
}
```

#### 3. 歯ブラシの特別表示

歯ブラシは「当日限り」なので、特に目立たせる：

```typescript
{exchange.reward_type === 'toothbrush' && !isExpired(exchange) && (
  <Alert variant="warning" className="mt-2">
    ⚠️ この特典は今日限り有効です！お早めにお受け取りください。
  </Alert>
)}
```

---

### B. バックエンド側（API制御）

#### 1. 交換申請API での期限チェック

**ファイル**: `app/api/rewards/exchange/route.ts`（または該当のAPI）

```typescript
export async function POST(request: NextRequest) {
  const { exchangeId, userId } = await request.json();

  const supabase = await createSupabaseServerClient();

  // 1. reward_exchange を取得
  const { data: exchange, error } = await supabase
    .from('reward_exchanges')
    .select('*')
    .eq('id', exchangeId)
    .eq('user_id', userId)
    .single();

  if (error || !exchange) {
    return NextResponse.json(
      { error: '特典が見つかりません' },
      { status: 404 }
    );
  }

  // 2. 有効期限チェック
  if (exchange.valid_until) {
    const now = new Date();
    const validUntil = new Date(exchange.valid_until);

    if (validUntil < now) {
      // 期限切れの場合、自動的に expired に更新
      await supabase
        .from('reward_exchanges')
        .update({ status: 'expired' })
        .eq('id', exchangeId);

      return NextResponse.json(
        { error: 'この特典は有効期限が切れています' },
        { status: 400 }
      );
    }
  }

  // 3. ステータスチェック
  if (exchange.status !== 'pending') {
    return NextResponse.json(
      { error: 'この特典は既に使用済みです' },
      { status: 400 }
    );
  }

  // 4. 交換処理を実行
  // ...
}
```

#### 2. 一覧取得API での期限切れ自動更新（オプション）

**ファイル**: `app/api/rewards/list/route.ts`（または該当のAPI）

```typescript
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  const supabase = await createSupabaseServerClient();

  // 1. 期限切れレコードを自動的に expired に更新（オプション）
  await supabase
    .from('reward_exchanges')
    .update({ status: 'expired' })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('valid_until', new Date().toISOString());

  // 2. 一覧を取得
  const { data: exchanges, error } = await supabase
    .from('reward_exchanges')
    .select('*')
    .eq('user_id', userId)
    .order('exchanged_at', { ascending: false });

  return NextResponse.json({ exchanges });
}
```

---

### C. 管理ダッシュボード側の対応（こちらで実装）

#### 1. 特典交換履歴ページでの表示

**ファイル**: `app/admin/reward-exchanges/page.tsx`

以下を追加予定：

```typescript
// 期限切れチェック
const isExpired = (exchange: RewardExchangeWithDetails): boolean => {
  if (!exchange.valid_until) return false;
  return new Date(exchange.valid_until) < new Date();
};

// 表示例
{exchange.status === 'pending' && isExpired(exchange) && (
  <Badge variant="warning" className="bg-amber-100 text-amber-700">
    ⚠️ 期限切れ（{formatDate(exchange.valid_until)}）
  </Badge>
)}
```

#### 2. 引き渡し完了時の期限チェック

```typescript
const handleComplete = async (id: string) => {
  const exchange = exchanges.find(ex => ex.id === id);

  // 期限切れ警告
  if (exchange?.valid_until && new Date(exchange.valid_until) < new Date()) {
    const confirmed = confirm(
      '⚠️ この特典は有効期限が切れています。それでも引き渡しを完了しますか？'
    );
    if (!confirmed) return;
  }

  // 引き渡し処理
  // ...
};
```

#### 3. expiredステータスの表示改善

すでに実装済み（2026-03-28）：
- `expired` ステータスのバッジ表示
- 型定義の更新

---

## 🗓️ 実装の優先順位

### Phase 1: 必須（すぐに実装すべき）

1. **LIFFアプリ側のフロントエンド制御**
   - 期限切れの特典を視覚的に区別
   - 「交換する」ボタンの無効化
   - 有効期限の表示

2. **バックエンドAPIでの期限チェック**
   - 交換申請時に期限を確認
   - 期限切れの場合はエラーを返す

### Phase 2: 推奨（ユーザー体験向上）

3. **自動期限切れ更新（一覧取得時）**
   - `GET /api/rewards/list` で期限切れを自動更新
   - フロントエンドの期限チェックと併用

4. **管理ダッシュボードの期限切れ表示**
   - スタッフ側で期限切れを視覚的に判別
   - 引き渡し時の警告表示

### Phase 3: オプション（運用改善）

5. **定期バッチ処理（cronジョブ）**
   - 日次で期限切れを一括更新
   - ただし、Phase 1-2 があれば必須ではない

---

## 📊 各アプローチの比較

| アプローチ | メリット | デメリット | 推奨度 |
|-----------|---------|-----------|--------|
| **フロントエンド制御** | ・リアルタイム表示<br>・サーバー負荷なし | ・クライアント側で改ざん可能 | ⭐⭐⭐ 必須 |
| **API期限チェック** | ・データ整合性確保<br>・不正防止 | ・実装が必要 | ⭐⭐⭐ 必須 |
| **一覧取得時の自動更新** | ・データが常に最新<br>・cronジョブ不要 | ・若干のAPI負荷 | ⭐⭐ 推奨 |
| **定期バッチ（cron）** | ・データ一括更新<br>・API負荷分散 | ・インフラが複雑<br>・遅延が発生 | ⭐ オプション |

---

## 🔧 管理ダッシュボード側での対応（実装済み）

### ✅ 実装済みの機能（2026-03-28）

1. **期限切れバッジの表示**
   ```typescript
   {isExpired(exchange) && (
     <Badge variant="warning">⚠️ 期限切れ</Badge>
   )}
   ```

2. **引き渡し完了時の警告**
   - 期限切れの特典を引き渡そうとした場合に確認ダイアログを表示
   - スタッフに注意喚起

3. **期限切れ復活機能（リスク対策）**
   - **目的**: 誤って期限切れになった特典をスタッフの判断で復活させる
   - **機能**:
     - `expired` または期限切れの `pending` 状態から `pending` に戻す
     - 有効期限の延長（日数指定）が可能
     - スタッフ名と操作履歴を `notes` に自動記録
   - **API**: `POST /api/reward-exchanges/[id]/reactivate`
   - **実装場所**: `app/admin/reward-exchanges/page.tsx`

   ```typescript
   // 復活処理の例
   const handleReactivate = async (id: string) => {
     const extendDaysStr = prompt(
       "有効期限を延長する場合は日数を入力してください（例: 7）\n※入力しない場合は元の期限のまま復活します",
       "7"
     );

     const extendDays = extendDaysStr ? parseInt(extendDaysStr) : 0;

     const response = await fetch(`/api/reward-exchanges/${id}/reactivate`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ extendDays })
     });

     // ... 処理
   };
   ```

4. **フィルタ機能の追加（将来予定）**
   - 「期限切れのみ表示」オプション

### データベース側の対応

- ✅ `reward_exchanges.valid_until` カラムは既に存在
- ✅ `status = 'expired'` の型定義は完了
- ✅ `expired` バッジの表示は実装済み
- ✅ 復活処理で `notes` に操作履歴を記録

### リスク対策: 期限切れ復活機能の運用ガイド

**使用場面**:
- 患者が来院したが、特典の有効期限が数日前に切れていた
- スタッフの操作ミスで期限内に引き渡しができなかった
- システムトラブルで期限切れになってしまった

**操作手順**:
1. 特典交換履歴ページで期限切れの特典を確認
2. 「復活」ボタンをクリック
3. 延長する日数を入力（例: 7日延長）
4. 確認後、`status` が `pending` に戻り、有効期限が延長される
5. `notes` に操作履歴が自動記録される

**記録される情報**:
```
[2026-03-28T10:30:00.000Z] 田中スタッフ が期限切れを解除し、有効期限を7日延長
```

**注意事項**:
- 復活操作は必ず患者本人の確認後に実施すること
- 理由なく頻繁に復活させないこと（ポリシー違反）
- 操作履歴は監査用に保存されます

---

## 💡 実装の推奨手順

### ステップ1: LIFFアプリ側（フロントエンド）

1. 特典一覧で `valid_until` をチェック
2. 期限切れの場合:
   - 「有効期限切れ」バッジを表示
   - 「交換する」ボタンを無効化
   - グレーアウト表示
3. 有効期限が近い場合:
   - 「あと○日」を表示
   - 歯ブラシは「今日限り」を強調

### ステップ2: LIFFアプリ側（バックエンドAPI）

1. 交換申請API に期限チェックを追加
2. 期限切れの場合:
   - `status = 'expired'` に自動更新
   - エラーメッセージを返す
3. レスポンス例:
   ```json
   {
     "error": "この特典は有効期限が切れています",
     "code": "REWARD_EXPIRED"
   }
   ```

### ステップ3: 管理ダッシュボード側（こちらで対応）

1. 期限切れバッジの表示
2. 引き渡し完了時の警告
3. （オプション）期限切れフィルタ

---

## 📝 データベースクエリ例

### 期限切れの特典を取得

```sql
SELECT *
FROM reward_exchanges
WHERE status = 'pending'
  AND valid_until < NOW();
```

### 期限切れを一括更新

```sql
UPDATE reward_exchanges
SET status = 'expired'
WHERE status = 'pending'
  AND valid_until < NOW();
```

### ユーザーごとの期限切れ件数

```sql
SELECT
  user_id,
  COUNT(*) as expired_count
FROM reward_exchanges
WHERE status = 'expired'
GROUP BY user_id;
```

---

## 🚨 注意事項

### 1. タイムゾーン

- `valid_until` は UTC で保存されている
- 日本時間（JST）で表示する場合は変換が必要:
  ```typescript
  const jstDate = new Date(exchange.valid_until);
  const jstString = jstDate.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo'
  });
  ```

### 2. 歯ブラシの「当日限り」

- `valid_until` は「翌日0時」に設定されている
- 例: 2026-03-28に付与 → valid_until = 2026-03-28T23:59:59+09:00
- 3月29日になると自動的に期限切れ

### 3. 期限切れでも削除はしない

- `status = 'expired'` として残す
- 理由:
  - 特典付与履歴として残す
  - スタッフが状況を確認できる
  - 統計データに使用

---

## 📞 質問・相談

実装に関して質問がある場合は、以下を確認してください：

- **データベース設計**: [05_Database_Schema.md](./05_Database_Schema.md)
- **特典仕様**: [55_特典仕様変更.md](./55_特典仕様変更.md)
- **交換履歴仕様**: [11_特典交換履歴機能仕様書.md](./11_特典交換履歴機能仕様書.md)

管理ダッシュボード側の実装が必要な場合は、こちらで対応します。

---

**作成者**: 管理ダッシュボード開発チーム
**最終更新**: 2026-03-28
