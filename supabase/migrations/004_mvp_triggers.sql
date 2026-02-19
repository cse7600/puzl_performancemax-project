-- MVP 핵심 트리거 3개
-- 1. referral_code 자동생성
-- 2. referral_code 매칭 + 중복 검사
-- 3. 정산 자동 생성

-- ============================================
-- 트리거 1: referral_code 자동생성
-- ============================================
-- 파트너 가입 시 6자리 영숫자 코드 자동 생성
-- 예: A3K9F2, B7M2P8

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- 기존에 referral_code가 비어있거나 기본값일 때만 새로 생성
  IF NEW.referral_code IS NULL OR
     NEW.referral_code = upper(substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 5)) THEN
    -- md5 해시로 랜덤 6자리 생성 (대문자)
    NEW.referral_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 등록 (partners 테이블)
DROP TRIGGER IF EXISTS trigger_generate_referral_code ON partners;
CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT OR UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

COMMENT ON FUNCTION generate_referral_code() IS '파트너 가입 시 6자리 referral_code 자동 생성';

-- ============================================
-- 트리거 2: referral_code 매칭 + 중복 검사
-- ============================================
-- 리퍼럴 제출 시 자동으로:
-- 1. referral_code_input → partner_id 매칭
-- 2. 중복 검사 (같은 광고주 내 이메일/전화번호)
-- 3. commission_amount 자동 계산 (campaigns 테이블 기준)

CREATE OR REPLACE FUNCTION match_partner_by_code()
RETURNS TRIGGER AS $$
DECLARE
  v_base_commission DECIMAL(10,2);
BEGIN
  -- 1. partner_id 매칭 (referral_code_input → partners 테이블 조회)
  IF NEW.referral_code_input IS NOT NULL AND NEW.partner_id IS NULL THEN
    SELECT id INTO NEW.partner_id
    FROM partners
    WHERE referral_code = NEW.referral_code_input
      AND advertiser_id = NEW.advertiser_id;

    -- 매칭 실패 시 에러 (유효하지 않은 코드)
    IF NEW.partner_id IS NULL THEN
      RAISE EXCEPTION '유효하지 않은 추천 코드입니다: %', NEW.referral_code_input;
    END IF;
  END IF;

  -- 2. 중복 검사 (같은 광고주 내 이메일 or 전화번호 중복)
  -- contract_status가 'duplicate'가 아닌 경우에만 검사
  IF NEW.contract_status != 'duplicate' AND EXISTS (
    SELECT 1 FROM referrals
    WHERE advertiser_id = NEW.advertiser_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (NEW.phone IS NOT NULL AND phone = NEW.phone) OR
        (NEW.name IS NOT NULL AND name = NEW.name)
      )
      AND contract_status != 'duplicate'
    LIMIT 1
  ) THEN
    -- 중복 발견 시 contract_status를 'duplicate'로 설정
    NEW.contract_status := 'duplicate';
    NEW.is_valid := false;
  END IF;

  -- 3. commission_amount 자동 계산 (campaigns 테이블에서 base_commission 가져오기)
  -- 현재 활성화된 캠페인의 수수료를 적용
  IF NEW.commission_amount IS NULL THEN
    SELECT
      CASE
        WHEN NEW.contract_status = 'completed' THEN COALESCE(c.contract_amount, c.valid_amount, 0)
        ELSE COALESCE(c.valid_amount, 0)
      END
    INTO v_base_commission
    FROM campaigns c
    WHERE c.advertiser_id = NEW.advertiser_id
      AND c.is_active = true
      AND (c.start_date IS NULL OR c.start_date <= CURRENT_DATE)
      AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
    ORDER BY c.created_at DESC
    LIMIT 1;

    NEW.commission_amount := COALESCE(v_base_commission, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 등록 (referrals 테이블)
DROP TRIGGER IF EXISTS trigger_match_partner_by_code ON referrals;
CREATE TRIGGER trigger_match_partner_by_code
  BEFORE INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION match_partner_by_code();

COMMENT ON FUNCTION match_partner_by_code() IS '리퍼럴 제출 시 partner_id 자동 매칭 + 중복 검사 + 수수료 계산';

-- ============================================
-- 트리거 3: 정산 자동 생성
-- ============================================
-- contract_status가 'completed'로 변경되면 자동으로 settlements 테이블에 INSERT
-- 중복 방지: referral_id 기준으로 UNIQUE 제약조건 활용

CREATE OR REPLACE FUNCTION auto_create_settlement()
RETURNS TRIGGER AS $$
DECLARE
  v_settlement_type TEXT;
  v_settlement_amount INT;
BEGIN
  -- contract_status가 'completed'로 변경된 경우에만 실행
  IF NEW.contract_status = 'completed' AND
     (OLD.contract_status IS NULL OR OLD.contract_status != 'completed') AND
     NEW.is_valid = true THEN

    -- settlement 타입 결정 (valid 또는 contract)
    -- is_valid = true면 'valid', contracted_at이 있으면 'contract'
    IF NEW.contracted_at IS NOT NULL THEN
      v_settlement_type := 'contract';
    ELSE
      v_settlement_type := 'valid';
    END IF;

    -- 수수료 금액 계산
    v_settlement_amount := COALESCE(NEW.commission_amount, 0);

    -- settlements 테이블에 INSERT (중복 시 무시)
    INSERT INTO settlements (
      partner_id,
      advertiser_id,
      referral_id,
      type,
      amount,
      status,
      created_at
    )
    VALUES (
      NEW.partner_id,
      NEW.advertiser_id,
      NEW.id,
      v_settlement_type,
      v_settlement_amount,
      'pending', -- 초기 상태는 'pending'
      NOW()
    )
    ON CONFLICT (referral_id) DO NOTHING; -- 중복 방지
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 등록 (referrals 테이블)
DROP TRIGGER IF EXISTS trigger_auto_create_settlement ON referrals;
CREATE TRIGGER trigger_auto_create_settlement
  AFTER INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_settlement();

COMMENT ON FUNCTION auto_create_settlement() IS 'contract_status가 completed로 변경 시 자동으로 settlements 생성';

-- ============================================
-- 추가: settlements 테이블에 UNIQUE 제약조건 추가
-- ============================================
-- referral_id당 하나의 정산만 존재하도록 보장
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'settlements_referral_id_unique'
  ) THEN
    ALTER TABLE settlements
    ADD CONSTRAINT settlements_referral_id_unique UNIQUE (referral_id);
  END IF;
END $$;

-- 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_referrals_code_advertiser ON referrals(referral_code_input, advertiser_id);
CREATE INDEX IF NOT EXISTS idx_partners_code ON partners(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status) WHERE status = 'pending';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ MVP 트리거 3개 마이그레이션 완료:';
  RAISE NOTICE '   1. generate_referral_code() - 파트너 가입 시 코드 자동 생성';
  RAISE NOTICE '   2. match_partner_by_code() - 리퍼럴 제출 시 매칭 + 중복 검사';
  RAISE NOTICE '   3. auto_create_settlement() - 계약 완료 시 정산 자동 생성';
END $$;
