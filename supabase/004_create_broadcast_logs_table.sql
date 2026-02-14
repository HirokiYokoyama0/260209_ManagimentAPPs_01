-- ============================================
-- つくばホワイト歯科 管理ダッシュボード
-- 一斉配信ログテーブル作成スクリプト
-- ============================================

-- broadcast_logs テーブルの作成
CREATE TABLE IF NOT EXISTS broadcast_logs (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 配信情報
  sent_by TEXT NOT NULL,                    -- 送信者（管理者名またはID）
  segment_conditions JSONB NOT NULL,        -- セグメント条件（JSON形式）
  message_text TEXT NOT NULL,               -- 送信メッセージ内容

  -- 配信結果
  target_count INTEGER NOT NULL,            -- 対象者数
  success_count INTEGER DEFAULT 0,          -- 送信成功数
  failed_count INTEGER DEFAULT 0,           -- 送信失敗数

  -- タイムスタンプ
  sent_at TIMESTAMPTZ DEFAULT NOW(),        -- 送信実行日時
  created_at TIMESTAMPTZ DEFAULT NOW()      -- レコード作成日時
);

-- ============================================
-- インデックスの作成
-- ============================================

-- 送信日時の降順インデックス（配信履歴を新しい順に取得）
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_sent_at
  ON broadcast_logs(sent_at DESC);

-- 送信者でのインデックス（特定の管理者の配信履歴を検索）
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_sent_by
  ON broadcast_logs(sent_by);

-- ============================================
-- Row Level Security (RLS) の設定
-- ============================================

ALTER TABLE broadcast_logs ENABLE ROW LEVEL SECURITY;

-- 管理者は全てのログを閲覧可能
CREATE POLICY "allow_public_read"
  ON broadcast_logs
  FOR SELECT
  USING (true);

-- 管理者はログを作成可能
CREATE POLICY "allow_public_insert"
  ON broadcast_logs
  FOR INSERT
  WITH CHECK (true);

-- ログの更新は許可しない（履歴の改ざん防止）
-- CREATE POLICY "deny_update" ON broadcast_logs FOR UPDATE USING (false);

-- ログの削除は許可しない（履歴の保持）
-- CREATE POLICY "deny_delete" ON broadcast_logs FOR DELETE USING (false);

-- ============================================
-- コメント
-- ============================================

COMMENT ON TABLE broadcast_logs IS '一斉配信の履歴を記録するテーブル';
COMMENT ON COLUMN broadcast_logs.sent_by IS '送信を実行した管理者の名前またはID';
COMMENT ON COLUMN broadcast_logs.segment_conditions IS 'セグメント条件をJSON形式で保存（スタンプ数、来院間隔など）';
COMMENT ON COLUMN broadcast_logs.message_text IS '実際に送信されたメッセージ内容';
COMMENT ON COLUMN broadcast_logs.target_count IS '配信対象となった患者数';
COMMENT ON COLUMN broadcast_logs.success_count IS 'LINE API経由で送信に成功した数';
COMMENT ON COLUMN broadcast_logs.failed_count IS '送信に失敗した数';
