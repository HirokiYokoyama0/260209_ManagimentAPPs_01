-- ケア記録テーブル（最短セットアップ: RLS は profiles と同様に許可）
CREATE TABLE IF NOT EXISTS care_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_messages_profile_id ON care_messages(profile_id);
CREATE INDEX IF NOT EXISTS idx_care_messages_sent_at ON care_messages(sent_at DESC);

ALTER TABLE care_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_messages_select" ON care_messages FOR SELECT USING (true);
CREATE POLICY "care_messages_insert" ON care_messages FOR INSERT WITH CHECK (true);
