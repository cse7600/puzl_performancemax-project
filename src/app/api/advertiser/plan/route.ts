import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdvertiserSession } from '@/lib/auth'

// GET: 현재 플랜 + 전체 플랜 목록
export async function GET() {
  try {
    const session = await getAdvertiserSession()
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const supabase = await createClient()

    // 현재 광고주 플랜 정보
    const { data: advertiser } = await supabase
      .from('advertisers')
      .select('plan_id, trial_ends_at, credit_balance')
      .eq('id', session.advertiserUuid)
      .single()

    // 현재 파트너 수
    const { count: partnerCount } = await supabase
      .from('partner_programs')
      .select('id', { count: 'exact', head: true })
      .eq('advertiser_id', session.advertiserUuid)
      .in('status', ['approved', 'pending'])

    // 전체 플랜 목록
    const { data: plans } = await supabase
      .from('advertiser_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    return NextResponse.json({
      currentPlanId: advertiser?.plan_id || null,
      trialEndsAt: advertiser?.trial_ends_at || null,
      creditBalance: Number(advertiser?.credit_balance) || 0,
      partnerCount: partnerCount || 0,
      plans: plans || [],
    })
  } catch (error) {
    console.error('Plan GET error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST: 플랜 변경 (크레딧에서 차감)
export async function POST(request: NextRequest) {
  try {
    const session = await getAdvertiserSession()
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const supabase = await createClient()

    const { plan_id, billing_period } = await request.json()

    // 플랜 확인
    const { data: plan } = await supabase
      .from('advertiser_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (!plan) {
      return NextResponse.json({ error: '플랜을 찾을 수 없습니다' }, { status: 404 })
    }

    // enterprise는 별도 문의
    if (plan.name === 'enterprise') {
      return NextResponse.json({ error: '엔터프라이즈 플랜은 별도 문의가 필요합니다' }, { status: 400 })
    }

    // 현재 광고주 정보 조회
    const { data: advertiser } = await supabase
      .from('advertisers')
      .select('plan_id, credit_balance')
      .eq('id', session.advertiserUuid)
      .single()

    // 같은 플랜으로 변경 방지
    if (advertiser?.plan_id === plan_id) {
      return NextResponse.json({ error: '이미 사용 중인 플랜입니다' }, { status: 400 })
    }

    // 크레딧 확인 및 차감 (free는 무료)
    if (plan.name !== 'free') {
      const balance = Number(advertiser?.credit_balance) || 0
      const monthlyPrice = Number(plan.monthly_price) || 0

      // 연간 결제 시 20% 할인 (12개월분)
      const isYearly = billing_period === 'yearly'
      const price = isYearly
        ? Math.round(monthlyPrice * 12 * 0.8)
        : monthlyPrice
      const periodLabel = isYearly ? '12개월 (20% 할인)' : '1개월'

      if (balance < price) {
        return NextResponse.json({
          error: `크레딧이 부족합니다. 필요: ₩${price.toLocaleString()}, 보유: ₩${balance.toLocaleString()}`,
        }, { status: 400 })
      }

      // 크레딧 차감 + 플랜 업데이트를 한번에
      const newBalance = balance - price
      await supabase
        .from('advertisers')
        .update({ credit_balance: newBalance, plan_id: plan_id })
        .eq('id', session.advertiserUuid)

      // 거래 기록
      await supabase.from('credit_transactions').insert({
        advertiser_id: session.advertiserUuid,
        type: 'deduct',
        amount: -price,
        balance_after: newBalance,
        description: `${plan.display_name} 플랜 결제 (${periodLabel})`,
        created_by: 'system',
      })
    } else {
      // free 플랜으로 변경 (무료)
      await supabase
        .from('advertisers')
        .update({ plan_id: plan_id })
        .eq('id', session.advertiserUuid)
    }

    return NextResponse.json({ success: true, plan: plan.name })
  } catch (error) {
    console.error('Plan POST error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
