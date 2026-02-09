import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('advertiser_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // 세션 조회 및 만료 확인
    const { data: session, error: sessionError } = await supabase
      .from('advertiser_sessions')
      .select('*, advertisers(*)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    const advertiser = session.advertisers as any

    // 계정 상태 확인
    if (advertiser.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      advertiser: {
        id: advertiser.id,
        advertiserId: advertiser.advertiser_id,
        companyName: advertiser.company_name,
        userId: advertiser.user_id,
        logoUrl: advertiser.logo_url,
        primaryColor: advertiser.primary_color,
        contactEmail: advertiser.contact_email,
        contactPhone: advertiser.contact_phone,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
