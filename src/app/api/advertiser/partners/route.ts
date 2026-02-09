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

    const { data: partners, error } = await supabase
      .from('partners')
      .select('*')
      .eq('advertiser_id', session.advertiserUuid)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Partners query error:', error)
      return NextResponse.json(
        { error: '파트너 목록 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({ partners })

  } catch (error) {
    console.error('Partners API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
