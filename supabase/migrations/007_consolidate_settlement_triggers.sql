-- 정산 트리거 통합 마이그레이션
-- 기존 중복 트리거들을 제거하고 하나의 통합 트리거로 교체

-- ============================================
-- 1. 기존 트리거 제거
-- ============================================
-- 중복되는 정산 생성 트리거들을 모두 제거
DROP TRIGGER IF EXISTS trg_create_valid_settlement ON referrals;
DROP TRIGGER IF EXISTS trg_create_contract_settlement ON referrals;
DROP TRIGGER IF EXISTS trigger_auto_settlement ON referrals;

-- 기존 함수들도 제거 (새 통합 함수로 대체)
DROP FUNCTION IF EXISTS fn_create_valid_settlement();
DROP FUNCTION IF EXISTS fn_create_contract_settlement();
DROP FUNCTION IF EXISTS create_auto_settlement();

-- ============================================
-- 2. 통합 정산 트리거 함수
-- ============================================
-- contract_status가 'completed'로 변경되면 자동으로 settlements 테이블에 INSERT
-- valid/contract 타입을 자동으로 판단하여 생성

CREATE OR REPLACE FUNCTION auto_create_settlement()
RETURNS TRIGGER AS $$
DECLARE
  v_settlement_type TEXT;
  v_settlement_amount DECIMAL(10,2);
BEGIN
  -- contract_status가 'completed'로 변경된 경우에만 실행
  IF NEW.contract_status = 'completed' AND
     (OLD IS NULL OR OLD.contract_status IS NULL OR OLD.contract_status != 'completed') AND
     NEW.is_valid = true THEN

    -- settlement 타입 결정
    -- contracted_at이 있으면 'contract', 없으면 'valid'
    IF NEW.contracted_at IS NOT NULL THEN
      v_settlement_type := 'contract';
    ELSE
      v_settlement_type := 'valid';
    END IF;

    -- 수수료 금액 결정
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
      'pending',
      NOW()
    )
    ON CONFLICT (referral_id) DO NOTHING;

    RAISE NOTICE '✅ Settlement created: referral_id=%, type=%, amount=%', NEW.id, v_settlement_type, v_settlement_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. 통합 트리거 등록
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_create_settlement ON referrals;
CREATE TRIGGER trigger_auto_create_settlement
  AFTER INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_settlement();

COMMENT ON FUNCTION auto_create_settlement() IS '통합 정산 자동 생성 트리거 - contract_status가 completed로 변경 시 settlements 생성';

-- ============================================
-- 4. 검증 쿼리
-- ============================================
DO $$
DECLARE
  v_trigger_count INT;
  v_settlement_triggers TEXT[];
BEGIN
  -- referrals 테이블의 정산 관련 트리거 개수 확인
  SELECT COUNT(*), ARRAY_AGG(tgname)
  INTO v_trigger_count, v_settlement_triggers
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'referrals'
    AND t.tgname LIKE '%settlement%';

  RAISE NOTICE '========================================';
  RAISE NOTICE '정산 트리거 통합 완료';
  RAISE NOTICE '========================================';
  RAISE NOTICE '현재 settlement 관련 트리거 개수: %', v_trigger_count;
  RAISE NOTICE '트리거 목록: %', v_settlement_triggers;

  IF v_trigger_count = 1 THEN
    RAISE NOTICE '✅ 성공: 통합 트리거 1개만 존재';
  ELSE
    RAISE WARNING '⚠️  주의: 여전히 % 개의 settlement 트리거 존재', v_trigger_count;
  END IF;
END $$;
