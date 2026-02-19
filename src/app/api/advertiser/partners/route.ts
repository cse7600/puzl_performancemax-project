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

    // partner_programs를 통해 파트너 조회 (다대다 관계)
    const { data: enrollments, error } = await supabase
      .from('partner_programs')
      .select(`
        id,
        status,
        tier,
        referral_code,
        lead_commission,
        contract_commission,
        monthly_fee,
        applied_at,
        approved_at,
        created_at,
        partners!inner(
          id,
          name,
          channels,
          main_channel_link,
          created_at
        )
      `)
      .eq('advertiser_id', session.advertiserUuid)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Partners query error:', error)
      return NextResponse.json(
        { error: '파트너 목록 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    // 기존 응답 형태와 호환되게 평탄화
    const partners = (enrollments || []).map(e => {
      const partnerData = e.partners as unknown as {
        id: string
        name: string
        channels: string[] | null
        main_channel_link: string | null
        created_at: string
      }
      return {
        ...partnerData,
        status: e.status,
        tier: e.tier,
        referral_code: e.referral_code,
        lead_commission: e.lead_commission,
        contract_commission: e.contract_commission,
        monthly_fee: e.monthly_fee,
        program_id: e.id,
        applied_at: e.applied_at,
        approved_at: e.approved_at,
      }
    })

    return NextResponse.json({ partners })

  } catch (error) {
    console.error('Partners API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
