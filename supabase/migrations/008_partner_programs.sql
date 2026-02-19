-- =============================================
-- 008: partner_programs 중간 테이블 (다대다 파트너-광고주 관계)
-- =============================================

-- 1. partner_programs 테이블 생성
CREATE TABLE IF NOT EXISTS partner_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  tier TEXT NOT NULL DEFAULT 'authorized',
  referral_code TEXT NOT NULL DEFAULT '',
  lead_commission DECIMAL(10,2) DEFAULT 0,
  contract_commission DECIMAL(10,2) DEFAULT 0,
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, advertiser_id),
  UNIQUE(referral_code)
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_pp_partner ON partner_programs(partner_id);
CREATE INDEX IF NOT EXISTS idx_pp_advertiser ON partner_programs(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_pp_referral_code ON partner_programs(referral_code);
CREATE INDEX IF NOT EXISTS idx_pp_status ON partner_programs(status);

-- 3. RLS
ALTER TABLE partner_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on partner_programs" ON partner_programs USING (true) WITH CHECK (true);

-- 4. updated_at 트리거
CREATE TRIGGER update_pp_updated_at BEFORE UPDATE ON partner_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 추천코드 자동생성 트리거
CREATE OR REPLACE FUNCTION generate_program_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pp_referral_code BEFORE INSERT ON partner_programs
  FOR EACH ROW EXECUTE FUNCTION generate_program_referral_code();

-- 6. 기존 데이터 백필
INSERT INTO partner_programs (partner_id, advertiser_id, status, tier, referral_code,
  lead_commission, contract_commission, monthly_fee, applied_at, created_at)
SELECT id, advertiser_id, status, tier, referral_code,
  lead_commission, contract_commission, monthly_fee, created_at, created_at
FROM partners WHERE advertiser_id IS NOT NULL
ON CONFLICT (partner_id, advertiser_id) DO NOTHING;

UPDATE partner_programs SET approved_at = created_at WHERE status = 'approved';

-- 7. 광고주 테이블에 프로그램 마켓플레이스 필드 추가
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS program_name TEXT;
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS program_description TEXT;
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS default_lead_commission DECIMAL(10,2) DEFAULT 0;
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS default_contract_commission DECIMAL(10,2) DEFAULT 0;
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 8. 한화비전 프로그램 공개 설정
UPDATE advertisers SET
  program_name = '한화비전 키퍼 어필리에이트',
  program_description = 'CCTV·보안 솔루션 전문 어필리에이트 프로그램입니다. 고객 유치 시 건당 최대 20만원의 커미션을 받으실 수 있습니다.',
  default_lead_commission = 15000,
  default_contract_commission = 200000,
  is_public = true
WHERE advertiser_id = 'hanwha_vision';
