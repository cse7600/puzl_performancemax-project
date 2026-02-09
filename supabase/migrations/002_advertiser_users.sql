-- 광고주 사용자 테이블 분리 (멀티 유저 지원)
-- 기존 advertisers 테이블은 광고주(회사) 정보만 보관
-- 사용자 정보는 advertiser_users 테이블로 분리

-- 광고주 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS advertiser_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id TEXT NOT NULL,  -- advertisers.advertiser_id 참조
  user_id TEXT NOT NULL,        -- 로그인용 사용자 ID
  password_hash TEXT NOT NULL,  -- bcrypt로 해시된 비밀번호
  name TEXT,                    -- 사용자 이름
  email TEXT,                   -- 이메일
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 같은 광고주 내에서 user_id는 유니크해야 함
  UNIQUE (advertiser_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_advertiser_users_advertiser_id ON advertiser_users(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_advertiser_users_user_id ON advertiser_users(user_id);
CREATE INDEX IF NOT EXISTS idx_advertiser_users_lookup ON advertiser_users(advertiser_id, user_id);

-- 업데이트 트리거 적용
DROP TRIGGER IF EXISTS update_advertiser_users_updated_at ON advertiser_users;
CREATE TRIGGER update_advertiser_users_updated_at
  BEFORE UPDATE ON advertiser_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 광고주 세션 테이블 수정 (advertiser_users 참조로 변경)
-- 기존 세션은 유지하면서 새 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advertiser_sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE advertiser_sessions ADD COLUMN user_id UUID;
  END IF;
END $$;

-- RLS 정책
ALTER TABLE advertiser_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on advertiser_users"
  ON advertiser_users
  USING (true)
  WITH CHECK (true);

-- 기존 advertisers 테이블의 사용자 데이터를 advertiser_users로 마이그레이션
INSERT INTO advertiser_users (advertiser_id, user_id, password_hash, name, email, role, status)
SELECT
  advertiser_id,
  user_id,
  password_hash,
  company_name || ' Admin',
  contact_email,
  'admin',
  status
FROM advertisers
WHERE NOT EXISTS (
  SELECT 1 FROM advertiser_users au
  WHERE au.advertiser_id = advertisers.advertiser_id
    AND au.user_id = advertisers.user_id
);

-- 추가 데모 사용자 생성 (같은 광고주에 여러 사용자)
-- 비밀번호: password123 (bcrypt hash)
INSERT INTO advertiser_users (advertiser_id, user_id, password_hash, name, email, role, status)
VALUES
  ('hanwha_vision', 'manager1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '김매니저', 'manager1@hanwha-vision.com', 'manager', 'active'),
  ('hanwha_vision', 'viewer1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '박뷰어', 'viewer1@hanwha-vision.com', 'viewer', 'active')
ON CONFLICT (advertiser_id, user_id) DO NOTHING;

COMMENT ON TABLE advertiser_users IS '광고주별 사용자 계정 테이블 (멀티유저 지원)';
COMMENT ON COLUMN advertiser_users.advertiser_id IS '광고주 식별자 (advertisers.advertiser_id)';
COMMENT ON COLUMN advertiser_users.user_id IS '로그인용 사용자 ID (광고주 내 유니크)';
COMMENT ON COLUMN advertiser_users.role IS '사용자 권한: admin(모든 권한), manager(일부 제한), viewer(읽기 전용)';
