-- 012: 요금제 개편 v2 - Free 티어 추가 + 가격 재설계
-- B2B 구매 승인 심리 기반 가격 설정

-- max_programs 컬럼 추가 (없을 수 있으므로 IF NOT EXISTS)
ALTER TABLE advertiser_plans ADD COLUMN IF NOT EXISTS max_programs INTEGER NOT NULL DEFAULT 999999;

-- 기존 trial → free 변환
UPDATE advertiser_plans
SET name = 'free', display_name = 'Free', monthly_price = 0,
    max_partners = 3, max_programs = 1, sort_order = 0,
    features = '{"dashboard":true,"basic_report":true,"detailed_report":false,"custom_landing":false,"auto_payouts":false,"white_label":false,"api_access":false,"crm_integration":false,"branded_content":false,"dedicated_manager":false}'::jsonb
WHERE name = 'trial';

-- starter 업데이트 (₩49,000 - 팀장 단독 승인)
UPDATE advertiser_plans
SET monthly_price = 49000, max_partners = 30, max_programs = 3,
    features = '{"dashboard":true,"basic_report":true,"detailed_report":true,"custom_landing":true,"auto_payouts":false,"white_label":false,"api_access":false,"crm_integration":true,"branded_content":false,"dedicated_manager":false}'::jsonb
WHERE name = 'starter';

-- growth 업데이트 (₩99,000 - 부서장 승인)
UPDATE advertiser_plans
SET monthly_price = 99000, max_partners = 200, max_programs = 10,
    features = '{"dashboard":true,"basic_report":true,"detailed_report":true,"custom_landing":true,"auto_payouts":true,"white_label":false,"api_access":true,"crm_integration":true,"branded_content":true,"dedicated_manager":false}'::jsonb
WHERE name = 'growth';

-- pro → scale 이름 변경 (₩249,000 - 임원급 승인)
UPDATE advertiser_plans
SET name = 'scale', display_name = 'Scale', monthly_price = 249000,
    max_partners = 999999, max_programs = 999999,
    features = '{"dashboard":true,"basic_report":true,"detailed_report":true,"custom_landing":true,"auto_payouts":true,"white_label":true,"api_access":true,"crm_integration":true,"branded_content":true,"dedicated_manager":false}'::jsonb
WHERE name = 'pro';

-- enterprise features 업데이트
UPDATE advertiser_plans
SET max_programs = 999999,
    features = '{"dashboard":true,"basic_report":true,"detailed_report":true,"custom_landing":true,"auto_payouts":true,"white_label":true,"api_access":true,"crm_integration":true,"branded_content":true,"dedicated_manager":true}'::jsonb
WHERE name = 'enterprise';

-- free 플랜은 무기한이므로 trial_ends_at 제거
UPDATE advertisers SET trial_ends_at = NULL
WHERE plan_id IN (SELECT id FROM advertiser_plans WHERE name = 'free');
