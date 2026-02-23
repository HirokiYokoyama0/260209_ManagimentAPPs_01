-- ============================================
-- ユーザー行動ログ（event_logs）
-- 83_イベントログ設計（ユーザの操作ログ）.md に準拠
-- ============================================

CREATE TABLE IF NOT EXISTS event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_logs_user_id ON event_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_event_name ON event_logs(event_name);
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_source ON event_logs(source) WHERE source IS NOT NULL;

COMMENT ON TABLE event_logs IS 'ユーザー行動ログ（マーケティング・分析用）';
COMMENT ON COLUMN event_logs.user_id IS 'ユーザーID（profiles.id）';
COMMENT ON COLUMN event_logs.event_name IS 'イベント種別: app_open, stamp_scan_success など';
COMMENT ON COLUMN event_logs.source IS '流入元: line_msg_YYMMDD, direct など';
COMMENT ON COLUMN event_logs.metadata IS '追加データ（JSON）: user_agent, current_stamp_count など';

ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- 管理ダッシュボードはサービスロールで参照するため、anon用SELECTポリシーは任意
-- ユーザー自身のログのみINSERT可にする場合はLIFF側で app.current_user_id を設定してからINSERT
