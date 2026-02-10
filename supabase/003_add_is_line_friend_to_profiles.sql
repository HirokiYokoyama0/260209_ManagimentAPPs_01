-- ============================================
-- profiles に is_line_friend カラムを追加
-- ============================================
-- 公式アカウントの友だち登録済みかどうか（LINE 側で更新される想定）
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_line_friend BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN profiles.is_line_friend IS '公式アカウントの友だち登録済みか';
