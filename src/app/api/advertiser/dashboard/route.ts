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

    // 파트너 통계
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id, status')
      .eq('advertiser_id', advertiserUuid)

    if (partnersError) {
      console.error('Partners query error:', partnersError)
    }

    const totalPartners = partners?.length ?? 0
    const activePartners = partners?.filter(p => p.status === 'approved').length ?? 0

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

    // 최근 파트너
    const { data: recentPartners } = await supabase
      .from('partners')
      .select('id, name, created_at')
      .eq('advertiser_id', advertiserUuid)
      .order('created_at', { ascending: false })
      .limit(5)

    recentPartners?.forEach(p => {
      activities.push({
        id: p.id,
        type: 'partner',
        description: `새 파트너 가입: ${p.name}`,
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

    return NextResponse.json({
      stats: {
        totalPartners,
        activePartners,
        totalReferrals,
        validReferrals,
        totalSettlements,
        pendingSettlements,
        thisMonthSettlementAmount,
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
