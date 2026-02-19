import type { SupabaseClient } from '@supabase/supabase-js'

interface PlanLimitResult {
  allowed: boolean
  current: number
  max: number
  planName: string
}

export async function checkPlanLimit(
  supabase: SupabaseClient,
  advertiserId: string,
  limitType: 'partners' | 'programs'
): Promise<PlanLimitResult> {
  // 광고주의 현재 플랜 조회
  const { data: advertiser } = await supabase
    .from('advertisers')
    .select('plan_id, advertiser_plans(name, max_partners, max_programs)')
    .eq('id', advertiserId)
    .single()

  const plan = advertiser?.advertiser_plans as unknown as {
    name: string
    max_partners: number
    max_programs: number
  } | null

  const planName = plan?.name || 'free'
  const max = limitType === 'partners'
    ? (plan?.max_partners || 3)
    : (plan?.max_programs || 1)

  // 현재 사용량 카운트
  let current = 0
  if (limitType === 'partners') {
    const { count } = await supabase
      .from('partner_programs')
      .select('id', { count: 'exact', head: true })
      .eq('advertiser_id', advertiserId)
      .eq('status', 'approved')
    current = count || 0
  } else {
    // programs: advertiser가 보유한 프로그램(자기 자신이 1개) 개수
    // advertiser_id 기준으로 referral이 들어오는 프로그램을 카운팅
    // 단순히 advertiser 기준 active 프로그램 수로 카운트
    const { count } = await supabase
      .from('advertisers')
      .select('id', { count: 'exact', head: true })
      .eq('id', advertiserId)
    current = count || 0
  }

  return {
    allowed: current < max,
    current,
    max,
    planName,
  }
}

export async function checkFeatureAccess(
  supabase: SupabaseClient,
  advertiserId: string,
  feature: string
): Promise<boolean> {
  const { data: advertiser } = await supabase
    .from('advertisers')
    .select('plan_id, advertiser_plans(features)')
    .eq('id', advertiserId)
    .single()

  const features = (advertiser?.advertiser_plans as unknown as {
    features: Record<string, boolean>
  })?.features

  return features?.[feature] === true
}
