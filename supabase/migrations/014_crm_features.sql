-- 014: CRM 기능 추가 - 고객 메모, 라벨, 영업 퍼널 관리

-- referrals 테이블에 CRM 필드 추가
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS memo TEXT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ;

-- 파트너 자동 승인 설정 (advertiser별)
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS auto_approve_partners BOOLEAN DEFAULT true;

-- 간단 문의 폼 설정
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS inquiry_form_enabled BOOLEAN DEFAULT false;
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS inquiry_form_fields JSONB DEFAULT '["name","phone","inquiry"]'::jsonb;

-- referrals 인덱스
CREATE INDEX IF NOT EXISTS idx_referrals_labels ON referrals USING GIN (labels);
CREATE INDEX IF NOT EXISTS idx_referrals_priority ON referrals(priority);
