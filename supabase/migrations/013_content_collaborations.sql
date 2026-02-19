-- 013: 브랜디드 콘텐츠 협업 시스템

-- 콘텐츠 유형
CREATE TYPE content_type AS ENUM ('blog', 'youtube', 'instagram', 'tiktok', 'other');
-- 협업 상태
CREATE TYPE collab_status AS ENUM (
  'requested','accepted','in_progress','submitted','revision','completed','paid','declined','cancelled'
);

CREATE TABLE content_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertisers(id),
  partner_id UUID NOT NULL REFERENCES partners(id),
  -- 제안 내용
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  content_type content_type NOT NULL DEFAULT 'blog',
  budget DECIMAL NOT NULL CHECK (budget > 0),
  platform_fee_rate DECIMAL NOT NULL DEFAULT 0.10,
  platform_fee DECIMAL GENERATED ALWAYS AS (budget * platform_fee_rate) STORED,
  partner_payout DECIMAL GENERATED ALWAYS AS (budget * (1 - platform_fee_rate)) STORED,
  deadline DATE,
  -- 상태
  status collab_status NOT NULL DEFAULT 'requested',
  -- 결과물
  deliverable_url TEXT,
  deliverable_note TEXT,
  -- 거절/취소 사유
  decline_reason TEXT,
  cancel_reason TEXT,
  -- 타임스탬프
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 협업 내 메시지 (브리프 논의용)
CREATE TABLE collaboration_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES content_collaborations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('advertiser', 'partner')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_collabs_advertiser ON content_collaborations(advertiser_id);
CREATE INDEX idx_collabs_partner ON content_collaborations(partner_id);
CREATE INDEX idx_collabs_status ON content_collaborations(status);
CREATE INDEX idx_collab_msgs_collab ON collaboration_messages(collaboration_id);

-- RLS
ALTER TABLE content_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_messages ENABLE ROW LEVEL SECURITY;

-- content_collaborations: 파트너는 자기 건만
CREATE POLICY "Partners view own collaborations"
  ON content_collaborations FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

-- collaboration_messages: 참여자만
CREATE POLICY "Collaboration participants view messages"
  ON collaboration_messages FOR SELECT
  USING (collaboration_id IN (
    SELECT id FROM content_collaborations
    WHERE partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "Partners can insert messages"
  ON collaboration_messages FOR INSERT
  WITH CHECK (
    sender_type = 'partner'
    AND collaboration_id IN (
      SELECT id FROM content_collaborations
      WHERE partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid())
    )
  );
