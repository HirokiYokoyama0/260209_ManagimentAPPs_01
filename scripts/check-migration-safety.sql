-- ========================================
-- 023マイグレーション実行前の安全性チェック
-- ========================================

-- 1. 現在のreward_exchangesの状態を確認
SELECT
  '現在の特典交換履歴' as check_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_milestone_based = true) as milestone_count,
  COUNT(*) FILTER (WHERE is_milestone_based = false OR is_milestone_based IS NULL) as old_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count
FROM reward_exchanges;

-- 2. 無効化される予定のレコードを確認
SELECT
  '無効化予定のレコード' as info,
  user_id,
  status,
  notes,
  exchanged_at
FROM reward_exchanges
WHERE is_milestone_based IS NULL OR is_milestone_based = false
ORDER BY exchanged_at DESC;

-- 3. rewardsテーブルの状態を確認
SELECT
  '現在のrewardsマスター' as check_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM rewards;

-- 4. 外部キー制約の確認
SELECT
  '外部キー制約' as info,
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE contype = 'f'
  AND (conrelid::regclass::text = 'reward_exchanges' OR confrelid::regclass::text = 'rewards');

-- 5. milestone_rewardsが既に存在するか確認
SELECT
  'milestone_rewardsの存在確認' as check_type,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'milestone_rewards') as exists;

-- 6. milestone_historyが既に存在するか確認
SELECT
  'milestone_historyの存在確認' as check_type,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'milestone_history') as exists;
