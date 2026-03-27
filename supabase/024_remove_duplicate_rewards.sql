-- ========================================
-- 重複した milestone_rewards レコードを削除
-- ファイル: 024_remove_duplicate_rewards.sql
-- 作成日: 2026-03-27
-- 目的: 023実行により重複したレコードを削除（古い方を保持）
-- ========================================

-- 新しい方（2回目の挿入）を削除
DELETE FROM milestone_rewards
WHERE id IN (
  'a8d4d656-8525-4d69-b1c6-e0248c61f29c', -- 歯ブラシ（新）
  '2528a09a-447b-4371-8550-2d0ceeedd7ef', -- POIC（新）
  'bd6370bf-3395-4eb6-b2f3-47149a05bcef'  -- 自費メニュー（新）
);

-- 削除結果確認
SELECT
  'milestone_rewards レコード数' as info,
  COUNT(*) as count
FROM milestone_rewards;

-- 各タイプのレコード数確認
SELECT
  reward_type,
  COUNT(*) as count
FROM milestone_rewards
GROUP BY reward_type
ORDER BY reward_type;
