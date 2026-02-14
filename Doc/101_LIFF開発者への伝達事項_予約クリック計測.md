# LIFF開発者への伝達事項：予約ボタンクリック計測機能

**対象**: LIFF（LINE miniアプリ）開発担当者
**日付**: 2026年2月14日
**優先度**: 🟡 中（推奨だが必須ではない）
**実装時間**: 約15分

---

## 📋 要約（3行で）

1. **LIFF側**の「予約する」ボタンに、クリック計測APIを1行追加してください
2. エラーでもユーザー体験は妨げない設計です（予約ページは必ず開く）
3. バックエンドAPI・データベース側は別担当者が実装します（LIFF側は軽微な修正のみ）

---

## 🎯 背景・目的

### なぜ必要か？

現状、患者がLIFF内の「予約する」ボタンをクリックしても、その情報がどこにも記録されていません。

**クリニック側の要望**:
- 📊 どれだけの患者が予約に興味を持っているか数値で知りたい
- 📈 予約導線の改善効果を測定したい
- 👤 エンゲージメントの高い患者を特定したい

---

## 🛠️ あなた（LIFF開発者）がやること

### 修正対象ファイル（2つのみ）

1. `app/(liff)/adult/home/page.tsx` - 大人モードのホーム画面
2. `app/(liff)/kids/home/page.tsx` - キッズモードのホーム画面

### 修正内容

**`handleReservation`関数に1行追加するだけ**です。

---

## 📝 具体的な実装（コピペOK）

### ファイル1: `app/(liff)/adult/home/page.tsx`

#### 修正箇所

`handleReservation`関数（**109-130行目付近**）

#### Before（現在のコード）

```typescript
const handleReservation = async () => {
  // 診察券番号をコピー
  await navigator.clipboard.writeText(displayTicketNumber);
  alert(`診察券番号をコピーしました！...`);

  // アポツールを開く
  window.open("https://reservation.stransa.co.jp/...", "_blank");
};
```

#### After（修正後のコード）

```typescript
const handleReservation = async () => {
  if (displayTicketNumber === "未登録") {
    alert("診察券番号が登録されていません。受付でお尋ねください。");
    return;
  }

  try {
    // 診察券番号をコピー
    await navigator.clipboard.writeText(displayTicketNumber);
    alert(
      `診察券番号をコピーしました！\n予約画面で貼り付けてください。\n\n診察券番号: ${displayTicketNumber}`
    );

    // 🆕 予約ボタンのクリック数をカウント（エラーでも予約ページは開く）
    if (profile?.userId) {
      fetch(`/api/users/${profile.userId}/reservation-click`, {
        method: "POST",
      }).catch((error) => {
        console.error("クリックカウントエラー:", error);
        // エラーが発生しても予約ページは開く（ユーザー体験優先）
      });
    }

    // アポツールを開く
    window.open(
      "https://reservation.stransa.co.jp/tsukubawhite/",
      "_blank"
    );
  } catch (error) {
    console.error("予約ボタンエラー:", error);
    alert("エラーが発生しました。もう一度お試しください。");
  }
};
```

---

### ファイル2: `app/(liff)/kids/home/page.tsx`

**同様の修正を適用してください。**

`handleReservation`関数に、以下の部分を追加：

```typescript
// 🆕 予約ボタンのクリック数をカウント
if (profile?.userId) {
  fetch(`/api/users/${profile.userId}/reservation-click`, {
    method: "POST",
  }).catch((error) => {
    console.error("クリックカウントエラー:", error);
  });
}
```

---

## ⚠️ 重要な注意事項

### 1. エラーハンドリング

**絶対に守ってください**: APIコールが失敗しても予約ページは開く

```typescript
// ❌ ダメな例（awaitを使うとエラーで止まる）
await fetch('/api/users/...');
window.open('...'); // ← ここに到達しない可能性

// ✅ 良い例（.catch()でエラーを握りつぶす）
fetch('/api/users/...').catch(console.error);
window.open('...'); // ← 必ず実行される
```

**理由**:
- ユーザーは予約したいだけ
- API障害でクリック数が記録できなくても、予約機能は動作すべき
- ユーザー体験 > データ記録

### 2. `profile?.userId`の確認

```typescript
if (profile?.userId) {
  fetch(`/api/users/${profile.userId}/reservation-click`, ...);
}
```

- `profile`が`null`または`undefined`の場合はAPIを呼ばない
- `userId`が存在しない場合もAPIを呼ばない
- これは安全策として必須

### 3. オフライン時の動作

- ユーザーがオフラインの場合、APIコールは失敗します
- ただし、`.catch()`でエラーを握りつぶすので、予約ページは開きます
- **これは仕様として許容しています**（カウント漏れは許容、ユーザー体験優先）

---

## 🧪 テスト方法

### 1. ローカル開発環境でのテスト

```bash
# LIFFをローカルで起動
npm run dev
```

1. ブラウザのDevToolsを開く（F12）
2. 「予約する」ボタンをクリック
3. Networkタブで`reservation-click`のPOSTリクエストが送信されているか確認

**期待される動作**:
- POSTリクエストが`/api/users/[userId]/reservation-click`に送信される
- レスポンスが`{"success": true}`
- 予約ページが別タブで開く

**エラーが発生した場合**:
- コンソールに`"クリックカウントエラー:"`が表示される
- **それでも予約ページは開く**（これが正しい挙動）

### 2. 実機（LINEアプリ）でのテスト

1. LINE開発者コンソールでLIFF URLを取得
2. LINEアプリでminiアプリを開く
3. 「予約する」ボタンをクリック
4. 予約ページが開くことを確認

**バックエンド側の確認**（管理者が実施）:
```sql
-- Supabaseで該当ユーザーのクリック数が+1されているか確認
SELECT display_name, reservation_button_clicks
FROM profiles
WHERE id = 'U1234567890abcdef';
```

---

## 📡 APIの仕様（参考情報）

### エンドポイント

```
POST /api/users/[userId]/reservation-click
```

### リクエスト

- **Method**: POST
- **Body**: なし（空のPOSTリクエスト）
- **URL Parameter**: `userId` - LINEユーザーID（例: `U1234567890abcdef`）

### レスポンス

**成功時** (200 OK):
```json
{
  "success": true
}
```

**失敗時** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

### 処理内容

1. 指定されたユーザーIDの`reservation_button_clicks`カラムを+1
2. データベーストランザクションで安全に更新
3. 同時クリックにも対応（排他制御あり）

**重要**: このAPIはバックエンド開発者が実装します。LIFF側は呼び出すだけです。

---

## 🔄 実装の流れ（全体像）

```
1. バックエンド開発者がAPIとデータベースを実装
   ↓
2. あなた（LIFF開発者）が予約ボタンに1行追加 ← 今ここ
   ↓
3. デプロイ
   ↓
4. 管理ダッシュボード開発者が分析画面に表示を追加
```

**あなたが実装しなくても動きます**:
- 予約機能は今まで通り動作します
- ただし、クリック数の計測ができなくなります

---

## 📁 修正ファイル一覧

| ファイル | 修正内容 | 行数 |
|---------|---------|------|
| `app/(liff)/adult/home/page.tsx` | `handleReservation`関数に7行追加 | +7行 |
| `app/(liff)/kids/home/page.tsx` | `handleReservation`関数に7行追加 | +7行 |

**合計**: 2ファイル、14行の追加

---

## 🚀 実装の優先順位

| 作業 | 優先度 | 所要時間 |
|------|--------|----------|
| AdultHome修正 | 🔴 高 | 10分 |
| KidsHome修正 | 🔴 高 | 5分 |
| ローカルテスト | 🟡 中 | 5分 |
| 実機テスト | 🟢 低 | 5分 |

**合計実装時間**: 約25分

---

## 📞 質問・サポート

### よくある質問

**Q1: APIが404エラーを返します**
A: バックエンド開発者がAPIを実装していない可能性があります。バックエンド側の実装完了を待ってください。

**Q2: `profile.userId`が取れません**
A: LIFFの初期化処理を確認してください。`liff.getContext().userId`が正しく取得できているか確認が必要です。

**Q3: エラーが発生したらどうなる？**
A: コンソールにエラーログが出ますが、予約ページは正常に開きます。ユーザーには影響ありません。

**Q4: オフライン時は？**
A: カウントされませんが、予約ページは開きます。これは仕様として許容しています。

**Q5: 実装しないとどうなる？**
A: 予約機能は正常に動作します。ただし、クリニック側でデータ分析ができなくなります。

### 連絡先

実装中に不明点があれば、プロジェクト担当者までご連絡ください。

---

## 🔮 将来の拡張（参考情報）

現在は「累積カウンター」方式ですが、将来的により詳細な分析が必要になった場合：

- 日別・月別のクリック推移
- 時間帯別の分析
- ページごとのクリック分析（`source_page`パラメータ追加）

その場合、APIにパラメータを追加する可能性があります。その際は改めてご連絡します。

---

**作成日**: 2026年2月14日
**対象バージョン**: LIFF v1.0+
**重要度**: 🟡 中（推奨だが必須ではない）
**実装時間**: 約15分
