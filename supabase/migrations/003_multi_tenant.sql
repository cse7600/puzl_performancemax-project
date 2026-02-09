-- 멀티테넌트 마이그레이션
-- 모든 주요 테이블에 advertiser_id 추가 (광고주별 데이터 격리)

-- 1. referrals 테이블에 advertiser_id 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referrals' AND column_name = 'advertiser_id'
  ) THEN
    ALTER TABLE referrals ADD COLUMN advertiser_id UUID REFERENCES advertisers(id);
    CREATE INDEX IF NOT EXISTS idx_referrals_advertiser_id ON referrals(advertiser_id);
  END IF;
END $$;

-- 2. settlements 테이블에 advertiser_id 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settlements' AND column_name = 'advertiser_id'
  ) THEN
    ALTER TABLE settlements ADD COLUMN advertiser_id UUID REFERENCES advertisers(id);
    CREATE INDEX IF NOT EXISTS idx_settlements_advertiser_id ON settlements(advertiser_id);
  END IF;
END $$;

-- 3. campaigns 테이블에 advertiser_id 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'advertiser_id'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN advertiser_id UUID REFERENCES advertisers(id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser_id ON campaigns(advertiser_id);
  END IF;
END $$;

-- 4. promotions 테이블에 advertiser_id 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promotions' AND column_name = 'advertiser_id'
  ) THEN
    ALTER TABLE promotions ADD COLUMN advertiser_id UUID REFERENCES advertisers(id);
    CREATE INDEX IF NOT EXISTS idx_promotions_advertiser_id ON promotions(advertiser_id);
  END IF;
END $$;

-- 5. tier_rules 테이블에 advertiser_id 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tier_rules' AND column_name = 'advertiser_id'
  ) THEN
    ALTER TABLE tier_rules ADD COLUMN advertiser_id UUID REFERENCES advertisers(id);
    CREATE INDEX IF NOT EXISTS idx_tier_rules_advertiser_id ON tier_rules(advertiser_id);
  END IF;
END $$;

-- 6. 기존 데이터를 한화비전(hanwha_vision)에 귀속
-- partners 테이블 업데이트
UPDATE partners
SET advertiser_id = (SELECT id FROM advertisers WHERE advertiser_id = 'hanwha_vision' LIMIT 1)
WHERE advertiser_id IS NULL;

-- referrals 테이블 업데이트 (partner 기반으로)
UPDATE referrals r
SET advertiser_id = p.advertiser_id
FROM partners p
WHERE r.partner_id = p.id AND r.advertiser_id IS NULL;

-- settlements 테이블 업데이트 (partner 기반으로)
UPDATE settlements s
SET advertiser_id = p.advertiser_id
FROM partners p
WHERE s.partner_id = p.id AND s.advertiser_id IS NULL;

-- campaigns 테이블 업데이트
UPDATE campaigns
SET advertiser_id = (SELECT id FROM advertisers WHERE advertiser_id = 'hanwha_vision' LIMIT 1)
WHERE advertiser_id IS NULL;

-- promotions 테이블 업데이트 (campaign 기반으로)
UPDATE promotions pr
SET advertiser_id = c.advertiser_id
FROM campaigns c
WHERE pr.campaign_id = c.id AND pr.advertiser_id IS NULL;

-- tier_rules 테이블 업데이트 (campaign 기반으로)
UPDATE tier_rules tr
SET advertiser_id = c.advertiser_id
FROM campaigns c
WHERE tr.campaign_id = c.id AND tr.advertiser_id IS NULL;

-- 7. 웹훅 통합 설정 테이블
CREATE TABLE IF NOT EXISTS webhook_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('recatch', 'salesmap', 'custom')),
  api_key TEXT UNIQUE NOT NULL,
  api_secret TEXT NOT NULL,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_integrations_advertiser ON webhook_integrations(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_webhook_integrations_api_key ON webhook_integrations(api_key);

-- 8. 파트너 API 키 테이블
CREATE TABLE IF NOT EXISTS partner_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  rate_limit_monthly INT DEFAULT 1000,
  requests_this_month INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_api_keys_partner ON partner_api_keys(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_api_keys_api_key ON partner_api_keys(api_key);

-- 9. API 사용량 로그 테이블
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT CHECK (source_type IN ('partner_api', 'webhook')),
  source_id UUID,
  endpoint TEXT,
  method TEXT,
  status_code INT,
  ip_address TEXT,
  user_agent TEXT,
  request_body JSONB,
  response_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_source ON api_usage_logs(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created ON api_usage_logs(created_at);

-- 10. 파트너 링크 테이블
CREATE TABLE IF NOT EXISTS partner_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  short_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  click_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_links_partner ON partner_links(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_links_short_code ON partner_links(short_code);

-- 11. RLS 정책 설정
ALTER TABLE webhook_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_links ENABLE ROW LEVEL SECURITY;

-- 광고주용 RLS 정책 (API 레벨에서 처리하므로 모두 허용)
CREATE POLICY "Allow all on webhook_integrations" ON webhook_integrations USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on partner_api_keys" ON partner_api_keys USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on api_usage_logs" ON api_usage_logs USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on partner_links" ON partner_links USING (true) WITH CHECK (true);

-- 12. 업데이트 트리거 적용
DROP TRIGGER IF EXISTS update_webhook_integrations_updated_at ON webhook_integrations;
CREATE TRIGGER update_webhook_integrations_updated_at
  BEFORE UPDATE ON webhook_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_api_keys_updated_at ON partner_api_keys;
CREATE TRIGGER update_partner_api_keys_updated_at
  BEFORE UPDATE ON partner_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_links_updated_at ON partner_links;
CREATE TRIGGER update_partner_links_updated_at
  BEFORE UPDATE ON partner_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE webhook_integrations IS '광고주별 웹훅 연동 설정 (리캐치, 세일즈맵, 커스텀)';
COMMENT ON TABLE partner_api_keys IS '파트너별 API 키 (커스텀 문의폼용)';
COMMENT ON TABLE api_usage_logs IS 'API 사용량 로그';
COMMENT ON TABLE partner_links IS '파트너별 추천 링크 (UTM 파라미터 포함)';
