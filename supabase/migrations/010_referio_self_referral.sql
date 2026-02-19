-- 010: Referio 자체 추천 프로그램 - 시스템 프로그램 지원

ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Referio 공식 추천 프로그램
INSERT INTO advertisers (
  advertiser_id, company_name, user_id, password_hash, status,
  program_name, program_description,
  default_lead_commission, default_contract_commission,
  is_public, category, primary_color, is_system
)
VALUES (
  'referio_official',
  'Referio',
  'referio_system',
  '$2b$10$placeholder_hash_not_for_login',
  'active',
  'Referio 추천 프로그램',
  'Referio를 추천하고 추천인이 유료 플랜을 시작하면 매달 플랜 요금의 20%를 받으세요.',
  0, 0,
  true, 'etc', '#6366f1', true
)
ON CONFLICT (advertiser_id) DO NOTHING;
