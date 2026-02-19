-- 011: 파트너 메시징 시스템

CREATE TABLE IF NOT EXISTS partner_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'tier', 'specific')),
  target_tier TEXT,
  target_partner_ids UUID[],
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES partner_messages(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, partner_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_partner_messages_advertiser ON partner_messages(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_sent_at ON partner_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_message_reads_message ON partner_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_partner_message_reads_partner ON partner_message_reads(partner_id);

-- RLS
ALTER TABLE partner_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_message_reads ENABLE ROW LEVEL SECURITY;

-- 광고주가 자신의 메시지를 읽고 쓸 수 있음 (service role 사용 시 bypass)
CREATE POLICY "Service role full access on partner_messages"
  ON partner_messages FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on partner_message_reads"
  ON partner_message_reads FOR ALL
  USING (true)
  WITH CHECK (true);
