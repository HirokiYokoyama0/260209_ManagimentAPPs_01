# 特典仕様変更のお知らせ（LIFFアプリ開発者向け）

**作成日:** 2026-03-27
**対象:** LINEミニアプリ（LIFF）開発者
**重要度:** 🟡 中（特典内容の変更、既存UIで対応可能）
**関連ドキュメント:**
- [55_特典仕様変更.md](55_特典仕様変更.md) - 特典仕様変更の全体像
- [57_マイグレーション計画.md](57_マイグレーション計画.md) - マイグレーション計画
- [11_特典交換履歴機能仕様書.md](11_特典交換履歴機能仕様書.md) - 現行仕様

---

## 📢 変更概要

特典の内容が変更になります。**既存のLIFFアプリUIはそのまま使用可能**です。

### 変更前（現行）

| 特典名 | 必要スタンプ |
|--------|------------|
| オリジナル歯ブラシセット | 5スタンプ |
| フッ素塗布1回無料券 | 10スタンプ |
| 歯のクリーニング50%OFF券 | 15スタンプ |
| ホワイトニング1回30%OFF券 | 20スタンプ |

### 変更後（新仕様）

**マイルストーン到達で自動付与される特典:**

| 累積スタンプ数 | 付与される特典 | 詳細 | 有効期限 |
|--------------|--------------|------|---------|
| **10, 20, 30, 40...** | 歯ブラシ 1本 | TePeミニ / コンパクト / ピセラ / 替えブラシ 等から選択 | **当日限り** |
| **50, 100, 150, 200...** | POIC殺菌剤 | 初回のみ本体込、2回目以降は補充用のみ | **5ヶ月間** |
| **300, 450, 600...** | 選べる自費メニュー | 小顔エステ10%OFF / ホワイトニング10%OFF / その他自費10%OFF | **5ヶ月間** |

**⚠️ 重要な付与ルール（優先度）:**
- 複数のマイルストーンが重なる場合、**優先度が高い特典を1つのみ**付与
- **優先度:** 選べる自費メニュー > POIC殺菌剤 > 歯ブラシ
- 例: **50スタンプ到達** → POIC殺菌剤のみ（歯ブラシはスキップ）
- 例: **100スタンプ到達** → POIC殺菌剤のみ（歯ブラシはスキップ）
- 例: **300スタンプ到達** → 選べる自費メニューのみ（歯ブラシ・POICはスキップ）

---

## 🎯 LIFF側で必要な対応

### 必須対応

#### 1. 特典一覧の表示更新

**変更点:**
- `rewards` テーブルから取得していた固定4種類 → `milestone_rewards` テーブルから取得する3種類に変更

**API エンドポイント（既存）:**
```typescript
GET /api/rewards
```

**レスポンス（変更前）:**
```json
{
  "rewards": [
    { "id": "uuid-1", "name": "オリジナル歯ブラシセット", "required_stamps": 5 },
    { "id": "uuid-2", "name": "フッ素塗布1回無料券", "required_stamps": 10 },
    { "id": "uuid-3", "name": "歯のクリーニング50%OFF券", "required_stamps": 15 },
    { "id": "uuid-4", "name": "ホワイトニング1回30%OFF券", "required_stamps": 20 }
  ]
}
```

**レスポンス（変更後）:**
```json
{
  "rewards": [
    {
      "id": "uuid-1",
      "name": "歯ブラシ 1本",
      "description": "TePeミニ / コンパクト / ピセラ / 替えブラシ 等から選択",
      "milestone_type": "every_10",
      "validity_type": "same_day",
      "validity_description": "当日限り有効"
    },
    {
      "id": "uuid-2",
      "name": "POIC殺菌剤",
      "description": "POICウォーター（口腔内除菌水）",
      "milestone_type": "every_50",
      "is_first_time_special": true,
      "first_time_description": "初回のみ本体ごとプレゼント",
      "subsequent_description": "2回目以降は補充用のみ",
      "validity_months": 5,
      "validity_description": "5ヶ月間有効"
    },
    {
      "id": "uuid-3",
      "name": "選べる自費メニュー",
      "description": "小顔エステ10%OFF / ホワイトニング10%OFF / その他自費10%OFF から選択",
      "milestone_type": "every_150_from_300",
      "validity_months": 5,
      "validity_description": "5ヶ月間有効"
    }
  ]
}
```

**表示方法:**
```jsx
// 現在の表示
{rewards.map(reward => (
  <div key={reward.id}>
    <h3>{reward.name}</h3>
    <p>必要: {reward.required_stamps}スタンプ</p>
    <button>交換する</button>
  </div>
))}
```

**変更後の表示:**
```jsx
{rewards.map(reward => (
  <div key={reward.id}>
    <h3>{reward.name}</h3>
    <p>{reward.description}</p>
    <p className="milestone-info">
      {getMilestoneDescription(reward.milestone_type)}
    </p>
    <p className="validity">
      📅 有効期限: {reward.validity_description}
    </p>
  </div>
))}

// マイルストーンの説明を生成
function getMilestoneDescription(milestoneType) {
  switch (milestoneType) {
    case 'every_10':
      return '10スタンプごとに獲得（10, 20, 30...）';
    case 'every_50':
      return '50スタンプごとに獲得（50, 100, 150...）';
    case 'every_150_from_300':
      return '300スタンプ到達、以降150スタンプごと（300, 450, 600...）';
  }
}
```

#### 2. POIC初回/2回目の説明文表示

**実装例:**
```typescript
function getRewardDescription(reward, userRewardHistory) {
  if (reward.name === 'POIC殺菌剤') {
    // ユーザーが過去にPOICを受け取ったことがあるかチェック
    const hasReceivedPoic = userRewardHistory.some(
      h => h.reward_name === 'POIC殺菌剤'
    );

    return hasReceivedPoic
      ? reward.subsequent_description // '2回目以降は補充用のみ'
      : reward.first_time_description; // '初回のみ本体ごとプレゼント'
  }

  return reward.description;
}
```

#### 3. 有効期限の表示（全特典共通）

**実装例:**
```jsx
// 特典一覧画面
<div className="validity-info">
  <p>📅 有効期限: {reward.validity_description}</p>
  {reward.validity_type === 'same_day' && (
    <p className="note">※ 受け取り当日のみ有効です</p>
  )}
  {reward.validity_months && (
    <p className="note">※ 受け取り日から{reward.validity_months}ヶ月間有効です</p>
  )}
</div>

// 受け取り済み特典の有効期限表示
{exchange.valid_until && (
  <div className="expiry-date">
    <p>📅 有効期限: {formatDate(exchange.valid_until)}</p>
    {isExpiringSoon(exchange.valid_until) && (
      <p className="warning">⚠️ 期限が近づいています</p>
    )}
  </div>
)}
```

### オプション対応（推奨）

#### 4. 次のマイルストーン表示

ユーザーの現在のスタンプ数から、次にどの特典がもらえるかを表示すると親切です。

**実装例:**
```typescript
function getNextMilestone(currentStamps) {
  const milestones = [
    { stamps: Math.ceil(currentStamps / 10) * 10, reward: '歯ブラシ 1本', type: 'every_10' },
    { stamps: Math.ceil(currentStamps / 50) * 50, reward: 'POIC殺菌剤', type: 'every_50' }
  ];

  if (currentStamps < 300) {
    milestones.push({ stamps: 300, reward: '選べる自費メニュー', type: 'premium' });
  } else {
    const nextPremium = Math.ceil((currentStamps - 300) / 150) * 150 + 300;
    milestones.push({ stamps: nextPremium, reward: '選べる自費メニュー', type: 'premium' });
  }

  // 優先度でソート（選べる自費メニュー > POIC > 歯ブラシ）
  milestones.sort((a, b) => {
    if (a.stamps === b.stamps) {
      const priority = { premium: 3, every_50: 2, every_10: 1 };
      return priority[b.type] - priority[a.type];
    }
    return a.stamps - b.stamps;
  });

  return milestones[0];
}
```

**表示例:**
```jsx
const nextMilestone = getNextMilestone(currentStamps);

<div className="next-milestone">
  <p>次の特典まで:</p>
  <h3>{nextMilestone.reward}</h3>
  <p>あと {nextMilestone.stamps - currentStamps} スタンプ</p>
  <ProgressBar
    current={currentStamps}
    target={nextMilestone.stamps}
  />
</div>
```

---

## 🔄 既存のUIは維持可能

**変更不要な部分:**
- 特典一覧の画面構成
- 交換ボタンの動作
- スタンプ数の表示
- 受付での受け取りフロー

**既存のUI例:**
```
┌──────────────────────────┐
│ 特典一覧                  │
├──────────────────────────┤
│ 🎁 歯ブラシ 1本           │
│    10スタンプごとに獲得   │
│    📅 当日限り有効        │
│    [交換する]             │
├──────────────────────────┤
│ 🎁 POIC殺菌剤             │
│    50スタンプごとに獲得   │
│    初回のみ本体込         │
│    📅 5ヶ月間有効         │
│    [交換する]             │
├──────────────────────────┤
│ 🎁 選べる自費メニュー     │
│    300スタンプ到達で獲得  │
│    📅 5ヶ月間有効         │
│    [交換する]             │
└──────────────────────────┘
```

このようなシンプルな表示で十分です。

---

## 📋 データベース変更（参考情報）

### 新規テーブル

**`milestone_rewards` テーブル（新規作成）:**
- マイルストーン型の特典マスター
- 3種類の特典が登録される

### 既存テーブルの変更

**`reward_exchanges` テーブル（カラム追加）:**
- `milestone_reached`: マイルストーン到達数（10, 50, 300...）
- `valid_until`: 有効期限（全特典対応）
  - 歯ブラシ: 付与日の23:59:59
  - POIC: 付与日 + 5ヶ月後
  - 自費メニュー: 付与日 + 5ヶ月後
- `is_first_time`: 初回特典フラグ（POIC用）
- `is_milestone_based`: 新旧区別フラグ

**既存データは保持:**
- 旧システムで交換した7件のデータはそのまま残ります
- `is_milestone_based = false` で旧データと区別

---

## ⚠️ 注意事項

### 1. スタンプは減らない

現行仕様と同様、スタンプ数は減りません（積み上げ式）。

### 2. 優先度ルール

**50スタンプ到達時の例:**
- 10の倍数のルール: 歯ブラシ 1本
- 50の倍数のルール: POIC殺菌剤
- **実際に付与:** POIC殺菌剤のみ（優先度が高い）

ユーザーには「50スタンプでPOICが受け取れる」と案内してください。

### 3. 「交換する」ボタンの動作は変わらない

ユーザーが「交換する」ボタンをタップすると、従来通り `reward_exchanges` に記録されます。
バックエンド側でマイルストーンの自動付与ロジックが動作しますが、LIFF側の実装は変わりません。

---

## 🧪 テストケース

### テスト 1: 10スタンプ到達

**前提:** ユーザーのスタンプ数 = 8

**操作:** QRスキャンで5スタンプ付与 → 合計13スタンプ

**期待結果:**
- 特典一覧に「歯ブラシ 1本」が交換可能として表示される
- 「10スタンプごとに獲得」と表示される
- 「📅 当日限り有効」と表示される

### テスト 2: 50スタンプ到達（初回POIC）

**前提:** ユーザーのスタンプ数 = 45、POIC受け取り履歴なし

**操作:** QRスキャンで10スタンプ付与 → 合計55スタンプ

**期待結果:**
- 特典一覧に「POIC殺菌剤」が交換可能として表示される
- 説明文: 「初回のみ本体ごとプレゼント」
- 「📅 5ヶ月間有効」と表示される

### テスト 3: 100スタンプ到達（2回目POIC）

**前提:** ユーザーのスタンプ数 = 95、POIC受け取り履歴あり

**操作:** QRスキャンで10スタンプ付与 → 合計105スタンプ

**期待結果:**
- 特典一覧に「POIC殺菌剤」が交換可能として表示される
- 説明文: 「2回目以降は補充用のみ」
- 「📅 5ヶ月間有効」と表示される

### テスト 4: 300スタンプ到達

**前提:** ユーザーのスタンプ数 = 290

**操作:** QRスキャンで15スタンプ付与 → 合計305スタンプ

**期待結果:**
- 特典一覧に「選べる自費メニュー」が交換可能として表示される
- 「📅 5ヶ月間有効」と表示される

---

## 🙋 質問・確認事項

### Q1. 既存のLIFFアプリのコードはどこですか？

**A1.** 現在、LIFFアプリのソースコードは管理ダッシュボードとは別のリポジトリで管理されていると思われます。コードの場所を教えていただければ、より具体的な修正案を提示できます。

### Q2. 実装スケジュールはいつ頃ですか？

**A2.** バックエンド側のマイグレーションは2026年4月上旬を予定しています。LIFF側の実装可能時期をお知らせください。

### Q3. 「選べる自費メニュー」の選択UIはどうしますか？

**A3.** 以下の2つの方式があります：

- **方式A:** 交換時に3つから選択（モーダル表示）
- **方式B:** 交換後、受付スタッフと相談して選択

どちらが実装しやすいですか？

---

## 📞 次のステップ

### 1. 仕様確認

本ドキュメントの内容を確認し、不明点があればお知らせください。

### 2. 実装スケジュール調整

- バックエンド: 2026年4月上旬マイグレーション予定
- LIFF: いつ頃実装可能かお知らせください

### 3. テスト環境での動作確認

マイグレーション後、テスト環境で動作確認をお願いします。

---

## 関連ドキュメント

- [55_特典仕様変更.md](55_特典仕様変更.md) - 特典仕様変更の全体像
- [57_マイグレーション計画.md](57_マイグレーション計画.md) - マイグレーション計画
- [11_特典交換履歴機能仕様書.md](11_特典交換履歴機能仕様書.md) - 現行の特典システム

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2026-03-27 | 2.0 | 簡潔版に全面改訂（UI全面刷新→既存UI活用） |
| 2026-03-27 | 1.0 | 初版作成 |

---

最終更新: 2026-03-27
