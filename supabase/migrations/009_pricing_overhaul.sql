-- 009: 요금제 개편 - max_programs 컬럼 추가 및 플랜 업데이트

ALTER TABLE advertiser_plans ADD COLUMN IF NOT EXISTS max_programs INTEGER DEFAULT 1;

-- 기존 플랜 가격/한도 업데이트
UPDATE advertiser_plans SET monthly_price = 69000, max_partners = 20, max_programs = 2,
  features = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(features, '{}'::jsonb),
          '{auto_payouts}', 'false'
        ),
        '{white_label}', 'false'
      ),
      '{api_access}', 'false'
    ),
    '{dedicated_manager}', 'false'
  )
WHERE name = 'starter';

UPDATE advertiser_plans SET monthly_price = 149000, max_partners = 100, max_programs = 5,
  features = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(features, '{}'::jsonb),
          '{auto_payouts}', 'true'
        ),
        '{white_label}', 'false'
      ),
      '{api_access}', 'true'
    ),
    '{dedicated_manager}', 'false'
  )
WHERE name = 'growth';

-- Pro 티어 추가
INSERT INTO advertiser_plans (name, display_name, monthly_price, max_partners, max_programs, sort_order, is_active, features)
VALUES ('pro', 'Pro', 299000, 999999, 999999, 3, true,
  '{"dashboard": true, "basic_report": true, "detailed_report": true, "custom_landing": true, "priority_settlement": true, "api_access": true, "dedicated_manager": false, "auto_payouts": true, "white_label": true}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Enterprise 플랜 features 업데이트
UPDATE advertiser_plans SET max_programs = 999999,
  features = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(features, '{}'::jsonb),
          '{auto_payouts}', 'true'
        ),
        '{white_label}', 'true'
      ),
      '{api_access}', 'true'
    ),
    '{dedicated_manager}', 'true'
  )
WHERE name = 'enterprise';
