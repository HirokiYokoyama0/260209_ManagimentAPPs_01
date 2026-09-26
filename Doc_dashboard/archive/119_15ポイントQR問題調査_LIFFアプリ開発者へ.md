# 15ポイントQR問題調査結果 - LIFFアプリ開発者への緊急連絡

**作成日**: 2026年4月10日
**重要度**: 🔴 緊急
**影響範囲**: LINEアプリ v26.3.0ユーザー全員

---

## 📋 問題の概要

### 発生した事象

**診察券1019（谷田部寿恵）、7766（天羽壱吉）、5890（Youki）**にて：
- **15ポイントQRコードを読み込んだ**
- **実際には10ポイントしか付与されなかった**
- 管理画面から手動で+5ポイント修正済み

---

## 🔍 調査結果

### 1. 影響を受けたユーザーの共通点

**LINEアプリ v26.3.0を使用している全ユーザー（4/7時点で7人）**

| 診察券 | 名前 | QRポイント | 実際の付与 | 問題 |
|--------|------|-----------|-----------|------|
| 1019 | 谷田部寿恵 | 15 | 10 | ❌ -5 |
| 7766 | 天羽壱吉 | 15 | 10 | ❌ -5 |
| 5890 | Youki | 15 | 10 | ❌ -5 |
| 123459 | 横山浩紀 | 5 | 10 | ❌ +5 |
| 8604 | 中島千治 | 5 | 5 | ✅ 正常 |
| 0001 | 伊藤弘吉 | 5 | 5 | ✅ 正常 |

**パターン分析：**
- `amount=5` の場合：正常動作（5ポイント付与）
- `amount=15` の場合：**100%失敗**（10ポイント付与）
- `amount=5`（type=purchase）の一部：失敗（10ポイント付与）

### 2. 環境情報

**共通環境：**
```
LINEアプリバージョン: 26.3.0
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_1 like Mac OS X) ... Line/26.3.0 LIFF
デバイス: iPhone
OS: iOS 18.7 または 18.6.2
```

**注意**: User-Agentの`26_3_1`はiOSバージョンではなく、LINEアプリ v26.3.0が誤って解析された値です。

### 3. データベース記録の分析

#### ❌ 問題のあるケース（3件）

```sql
stamp_method: "qr"
notes: "ホームボタンスキャン (regular)"
qr_code_id: "https://liff.line.me/2009075851-74EieWb4?action=stamp&type=qr&amount=15&location=entrance"
amount: 10  -- ← URLには15と記載されているのに！
```

#### ✅ 正常なケース（6件）

```sql
stamp_method: "qr"
notes: "カメラ用QR (entrance)"
qr_code_id: null
amount: 15  -- ← 正常
```

### 4. 決定的な違い

| 項目 | 正常ケース | 問題ケース |
|------|-----------|-----------|
| qr_code_id | **null** | **LIFF URL全体** |
| notes | "カメラ用QR (entrance)" | "ホームボタンスキャン (regular)" |
| amount | URLパラメータ通り | **常に10** |

---

## 🎯 根本原因の特定

### 原因

**LIFFアプリ側のコードが、LINEアプリ v26.3.0環境下で：**

1. ❌ **URLパラメータ`amount`を正しく取得できていない**
2. ❌ **デフォルト値10を常に使用している**
3. ❌ **`qr_code_id`の保存方法が誤っている**（LIFF URL全体を保存）
4. ❌ **`notes`の判定ロジックも誤動作**（カメラQRなのに「ホームボタンスキャン」と記録）

### 証拠

**横山さん（診察券123459）のケース：**
```
URL: https://liff.line.me/2009075851-74EieWb4?action=stamp&type=purchase&amount=5&location=shop
                                                                            ^^^^^
                                                                        amount=5

実際の付与: 10ポイント  ← 不一致！
```

**URLに`type=purchase`（カメラQR専用）と記載されているのに、`stamp_method: qr`と記録され、`notes`が「ホームボタンスキャン」になっている**

### 推測されるコード

```typescript
// ❌ 現在の実装（推測）
const amount = 10;  // ハードコード？

// または
const params = new URLSearchParams(window.location.search);
const amount = parseInt(params.get('amount') || '10', 10);  // デフォルト10
// → LINEアプリ v26.3.0で params.get('amount') が null を返している？
```

---

## 🔧 修正依頼

### 緊急対応が必要な箇所

#### 1. URLパラメータの取得修正

```typescript
// 修正前（推測）
const amount = 10;  // または取得失敗時のデフォルト

// 修正後
const params = new URLSearchParams(window.location.search);
const amountStr = params.get('amount');

// デバッグログ追加
console.log('[DEBUG] URL:', window.location.href);
console.log('[DEBUG] amount param:', amountStr);

const amount = parseInt(amountStr || '1', 10);  // デフォルトは1に変更
console.log('[DEBUG] parsed amount:', amount);

// バリデーション
if (isNaN(amount) || amount < 1 || amount > 100) {
  console.error('[ERROR] Invalid amount:', amount);
  // エラー表示してユーザーに通知
  return;
}
```

#### 2. LINEアプリ v26.3.0での動作確認

**以下を確認してください：**

1. **LIFF初期化のタイミング**
   ```typescript
   await liff.init({ liffId: LIFF_ID });
   await liff.ready;  // ← これを待っているか？
   // その後にURLパラメータ取得
   const params = new URLSearchParams(window.location.search);
   ```

2. **`liff.getContext()`からのパラメータ取得**
   ```typescript
   const context = liff.getContext();
   console.log('[DEBUG] LIFF context:', context);
   // contextにURLパラメータが含まれている可能性
   ```

3. **LINEアプリ v26.3.0特有の問題**
   - `window.location.search`が空になっていないか？
   - URLフラグメント（`#`以降）にパラメータが移動していないか？
   - LIFF URLのリダイレクト時にパラメータが失われていないか？

#### 3. qr_code_idの保存方法修正

```typescript
// ❌ 現在（推測）
qr_code_id: window.location.href  // LIFF URL全体

// ✅ 修正後
qr_code_id: null  // カメラQRの場合はnull
// または
qr_code_id: `qr-${Date.now()}`  // ユニークなID
```

#### 4. notesの判定ロジック修正

```typescript
// カメラQRかアプリ内スキャンかの正確な判定
const isHomeButtonScan = /* 正しい判定条件 */;
const notes = isHomeButtonScan
  ? `ホームボタンスキャン (${location})`
  : `カメラ用QR (${location})`;
```

---

## 📊 影響範囲

### 現時点での影響

- **LINEアプリ v26.3.0ユーザー: 7人**（4/7時点）
- **問題発生: 4人**
  - 15ポイント不足: 3人（各-5ポイント）
  - 5ポイント過剰: 1人（+5ポイント）

### 潜在的リスク

**LINEアプリが自動更新でv26.3.0になったユーザー全員が影響を受ける可能性**

- 15ポイントQRを使用した場合：**100%の確率で10ポイントのみ付与**
- 5ポイントQR（一部）：10ポイント付与される可能性

---

## ⚠️ 重要な注意点

### 「ホームボタンスキャン」という記録は誤り

**ユーザーはカメラQRを使用していました。**

証拠：
1. URLに`type=qr`や`type=purchase`が含まれる（これはカメラQR専用のパラメータ）
2. 正常なカメラQR記録は`qr_code_id: null`になる
3. 問題ケースだけLIFF URL全体が保存されている

**つまり：**
- ❌ 「ミニアプリ内QRスキャンを使用しているのが問題」という仮説は誤り
- ✅ **カメラQRを使用したが、LIFFアプリ側で正しく処理できていなかった**

---

## 🔄 テスト依頼

### 再現テスト

1. **LINEアプリ v26.3.0の実機で15ポイントQRを読み込む**
2. **ブラウザのコンソールログを確認**
   - URLパラメータが取得できているか
   - `amount`の値は何になっているか
3. **デバッガーでステップ実行**
   - `URLSearchParams`で`amount`が取得できるタイミング
   - LIFFの初期化完了前/後での違い

### 修正後のテスト

1. 5ポイントQR → 5ポイント付与されるか
2. 10ポイントQR → 10ポイント付与されるか
3. 15ポイントQR → **15ポイント付与されるか**
4. `qr_code_id`が正しく保存されるか（nullまたはユニークID）
5. `notes`が正しく「カメラ用QR」と記録されるか

---

## 📝 参考情報

### データ比較スクリプト実行結果

作成したスクリプト：
- `scripts/investigate-tickets-1019-7766.ts` - 問題ユーザーの詳細調査
- `scripts/analyze-1019-7766-environment.ts` - 環境情報分析
- `scripts/find-ios26-users.ts` - iOS 26_3_1 User-Agent検索
- `scripts/compare-qr-access-methods.ts` - QRアクセス方法比較
- `scripts/check-yokoyama-123459.ts` - 横山さんの記録確認

### 関連ドキュメント

- [118_登録QR無限ループ問題_LIFFアプリ開発者へ.md](./118_登録QR無限ループ問題_LIFFアプリ開発者へ.md) - iOS 18.6.2+の別問題

---

## ✅ アクションアイテム

### LIFFアプリ開発者

- [ ] LINEアプリ v26.3.0でURLパラメータ取得のデバッグ
- [ ] `amount`パラメータが正しく読み取れない原因調査
- [ ] 修正コードの実装
- [ ] LINEアプリ v26.3.0実機でのテスト
- [ ] デフォルト値を10から1に変更（または適切なエラー表示）
- [ ] `qr_code_id`と`notes`の記録方法修正

### 管理ダッシュボード側（完了）

- [x] 問題の特定と調査完了
- [x] 影響を受けたユーザーの手動修正完了
  - 診察券1019: 10→15ポイント修正済み
  - 診察券7766: 10→15ポイント修正済み
  - 診察券5890: 10→15ポイント修正済み（要確認）

---

**この問題はLIFFアプリ側の緊急修正が必要です。LINEアプリの自動更新により、今後も同様の問題が発生する可能性が高いです。**
