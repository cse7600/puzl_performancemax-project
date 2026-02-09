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

    // 피추천인 목록 조회 (파트너 정보 포함)
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select(`
        *,
        partners (
          id,
          name,
          referral_code
        )
      `)
      .eq('advertiser_id', session.advertiserUuid)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Referrals query error:', error)
      return NextResponse.json(
        { error: '고객 목록 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    // 파트너 이름 추가
    const referralsWithPartnerName = referrals?.map(r => ({
      ...r,
      partner_name: r.partners?.name || null,
      partners: undefined, // 중첩 객체 제거
    }))

    return NextResponse.json({ referrals: referralsWithPartnerName })

  } catch (error) {
    console.error('Referrals API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
