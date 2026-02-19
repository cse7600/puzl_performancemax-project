-- ============================================
-- 정산 트리거 통합 마이그레이션
-- Supabase Dashboard SQL Editor에서 실행하세요
-- ============================================

-- 1. 기존 트리거 제거
DROP TRIGGER IF EXISTS trg_create_valid_settlement ON referrals;
DROP TRIGGER IF EXISTS trg_create_contract_settlement ON referrals;
DROP TRIGGER IF EXISTS trigger_auto_settlement ON referrals;

-- 2. 기존 함수 제거
DROP FUNCTION IF EXISTS fn_create_valid_settlement();
DROP FUNCTION IF EXISTS fn_create_contract_settlement();
DROP FUNCTION IF EXISTS create_auto_settlement();

-- 3. 통합 정산 트리거 함수 생성
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

    -- settlement 타입 결정 (contracted_at 유무로 판단)
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

-- 4. 통합 트리거 등록
DROP TRIGGER IF EXISTS trigger_auto_create_settlement ON referrals;
CREATE TRIGGER trigger_auto_create_settlement
  AFTER INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_settlement();

COMMENT ON FUNCTION auto_create_settlement() IS '통합 정산 자동 생성 트리거 - contract_status가 completed로 변경 시 settlements 생성';

-- 5. 검증 쿼리
SELECT
  COUNT(*) as settlement_trigger_count,
  ARRAY_AGG(tgname) as trigger_names
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'referrals'
  AND t.tgname LIKE '%settlement%';
