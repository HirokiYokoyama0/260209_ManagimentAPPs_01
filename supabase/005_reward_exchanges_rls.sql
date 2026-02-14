-- ============================================
-- reward_exchanges テーブルの RLS ポリシー設定
-- ============================================

-- RLS を有効化（すでに有効な場合はエラーにならない）
ALTER TABLE reward_exchanges ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "allow_public_read" ON reward_exchanges;
DROP POLICY IF EXISTS "allow_public_insert" ON reward_exchanges;
DROP POLICY IF EXISTS "allow_public_update" ON reward_exchanges;
DROP POLICY IF EXISTS "allow_public_delete" ON reward_exchanges;

-- 全てのユーザーに読み取り権限を付与
CREATE POLICY "allow_public_read"
  ON reward_exchanges
  FOR SELECT
  USING (true);

-- 全てのユーザーに挿入権限を付与
CREATE POLICY "allow_public_insert"
  ON reward_exchanges
  FOR INSERT
  WITH CHECK (true);

-- 全てのユーザーに更新権限を付与
CREATE POLICY "allow_public_update"
  ON reward_exchanges
  FOR UPDATE
  USING (true);

-- 全てのユーザーに削除権限を付与
CREATE POLICY "allow_public_delete"
  ON reward_exchanges
  FOR DELETE
  USING (true);
