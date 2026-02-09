-- 광고주 테이블 생성
CREATE TABLE IF NOT EXISTS advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id TEXT UNIQUE NOT NULL, -- 광고주 고유 ID (예: hanwha_vision)
  company_name TEXT NOT NULL,
  user_id TEXT UNIQUE NOT NULL, -- 로그인용 사용자 ID
  password_hash TEXT NOT NULL, -- bcrypt로 해시된 비밀번호
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  logo_url TEXT,
  primary_color TEXT, -- 브랜드 색상 (예: #f97316)
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 광고주 세션 테이블
CREATE TABLE IF NOT EXISTS advertiser_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_advertisers_advertiser_id ON advertisers(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_advertisers_user_id ON advertisers(user_id);
CREATE INDEX IF NOT EXISTS idx_advertiser_sessions_token ON advertiser_sessions(token);
CREATE INDEX IF NOT EXISTS idx_advertiser_sessions_expires_at ON advertiser_sessions(expires_at);

-- Partners 테이블에 advertiser_id 컬럼 추가 (기존 테이블이 있다면)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'partners' AND column_name = 'advertiser_id'
    ) THEN
      ALTER TABLE partners ADD COLUMN advertiser_id UUID REFERENCES advertisers(id);
      CREATE INDEX IF NOT EXISTS idx_partners_advertiser_id ON partners(advertiser_id);
    END IF;
  END IF;
END $$;

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 적용
DROP TRIGGER IF EXISTS update_advertisers_updated_at ON advertisers;
CREATE TRIGGER update_advertisers_updated_at
  BEFORE UPDATE ON advertisers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertiser_sessions ENABLE ROW LEVEL SECURITY;

-- 광고주는 자신의 데이터만 조회 가능
CREATE POLICY "Advertisers can view their own data"
  ON advertisers FOR SELECT
  USING (true); -- API 레벨에서 처리

CREATE POLICY "Advertisers can update their own data"
  ON advertisers FOR UPDATE
  USING (true); -- API 레벨에서 처리

-- 세션은 해당 광고주만 접근 가능
CREATE POLICY "Advertisers can view their own sessions"
  ON advertiser_sessions FOR SELECT
  USING (true); -- API 레벨에서 처리

-- 초기 데모 광고주 데이터 추가 (비밀번호: password123)
-- bcrypt hash for 'password123': $2a$10$rQ5vY8Z5Y5Z5Y5Z5Y5Z5YO (예시용, 실제로는 bcrypt로 해시해야 함)
INSERT INTO advertisers (advertiser_id, company_name, user_id, password_hash, status, primary_color, contact_email)
VALUES
  ('hanwha_vision', '한화비전', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'active', '#f97316', 'admin@hanwha-vision.com')
ON CONFLICT (advertiser_id) DO NOTHING;

COMMENT ON TABLE advertisers IS '광고주 계정 관리 테이블';
COMMENT ON TABLE advertiser_sessions IS '광고주 로그인 세션 관리 테이블';
COMMENT ON COLUMN advertisers.advertiser_id IS '광고주 고유 식별자 (URL-safe)';
COMMENT ON COLUMN advertisers.user_id IS '로그인용 사용자 ID';
COMMENT ON COLUMN advertisers.password_hash IS 'bcrypt로 해시된 비밀번호';
