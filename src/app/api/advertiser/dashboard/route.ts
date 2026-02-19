import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdvertiserSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getAdvertiserSession()

    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const advertiserUuid = session.advertiserUuid

    // 파트너 통계 (partner_programs 기반)
    const { data: programs, error: programsError } = await supabase
      .from('partner_programs')
      .select('id, status, partner_id')
      .eq('advertiser_id', advertiserUuid)

    if (programsError) {
      console.error('Partner programs query error:', programsError)
    }

    const totalPartners = programs?.length ?? 0
    const activePartners = programs?.filter(p => p.status === 'approved').length ?? 0

    // 피추천인 통계
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id, is_valid')
      .eq('advertiser_id', advertiserUuid)

    if (referralsError) {
      console.error('Referrals query error:', referralsError)
    }

    const totalReferrals = referrals?.length ?? 0
    const validReferrals = referrals?.filter(r => r.is_valid === true).length ?? 0

    // 크레딧 + 플랜 정보
    const { data: advInfo } = await supabase
      .from('advertisers')
      .select('credit_balance, plan_id, trial_ends_at, advertiser_plans(name, display_name, max_partners)')
      .eq('id', advertiserUuid)
      .single()

    // 정산 통계
    const { data: settlements, error: settlementsError } = await supabase
      .from('settlements')
      .select('id, status, amount, created_at')
      .eq('advertiser_id', advertiserUuid)

    if (settlementsError) {
      console.error('Settlements query error:', settlementsError)
    }

    const totalSettlements = settlements?.length ?? 0
    const pendingSettlements = settlements?.filter(s => s.status === 'pending').length ?? 0

    // 이번 달 정산 금액
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthSettlementAmount = settlements
      ?.filter(s => new Date(s.created_at) >= firstDayOfMonth)
      .reduce((sum, s) => sum + (s.amount || 0), 0) ?? 0

    // 최근 활동 (최신 10개)
    const activities: Array<{
      id: string
      type: 'partner' | 'referral' | 'settlement'
      description: string
      createdAt: string
    }> = []

    // 최근 파트너 (partner_programs 기반)
    const { data: recentPrograms } = await supabase
      .from('partner_programs')
      .select('id, created_at, partners!inner(name)')
      .eq('advertiser_id', advertiserUuid)
      .order('created_at', { ascending: false })
      .limit(5)

    recentPrograms?.forEach(p => {
      const partnerData = p.partners as unknown as { name: string }
      activities.push({
        id: p.id,
        type: 'partner',
        description: `새 파트너 신청: ${partnerData.name}`,
        createdAt: p.created_at,
      })
    })

    // 최근 피추천인
    const { data: recentReferrals } = await supabase
      .from('referrals')
      .select('id, name, created_at')
      .eq('advertiser_id', advertiserUuid)
      .order('created_at', { ascending: false })
      .limit(5)

    recentReferrals?.forEach(r => {
      activities.push({
        id: r.id,
        type: 'referral',
        description: `새 고객 유입: ${r.name?.substring(0, 1)}**`,
        createdAt: r.created_at,
      })
    })

    // 최근 정산
    const { data: recentSettlements } = await supabase
      .from('settlements')
      .select('id, amount, status, created_at')
      .eq('advertiser_id', advertiserUuid)
      .order('created_at', { ascending: false })
      .limit(5)

    recentSettlements?.forEach(s => {
      activities.push({
        id: s.id,
        type: 'settlement',
        description: `정산 ${s.status === 'completed' ? '완료' : '대기'}: ₩${s.amount.toLocaleString()}`,
        createdAt: s.created_at,
      })
    })

    // 시간순 정렬
    activities.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const planData = advInfo?.advertiser_plans as unknown as { name: string; display_name: string; max_partners: number } | null

    return NextResponse.json({
      stats: {
        totalPartners,
        activePartners,
        totalReferrals,
        validReferrals,
        totalSettlements,
        pendingSettlements,
        thisMonthSettlementAmount,
        creditBalance: Number(advInfo?.credit_balance) || 0,
      },
      plan: {
        name: planData?.name || 'trial',
        displayName: planData?.display_name || '무료 체험',
        maxPartners: planData?.max_partners || 5,
        trialEndsAt: advInfo?.trial_ends_at || null,
      },
      activities: activities.slice(0, 10),
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
