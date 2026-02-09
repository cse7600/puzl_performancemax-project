import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdvertiserSession, canManage } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdvertiserSession()

    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 권한 확인 (admin 또는 manager만 파트너 상태 변경 가능)
    if (!canManage(session)) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태값입니다' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 해당 광고주의 파트너인지 확인
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, advertiser_id')
      .eq('id', id)
      .eq('advertiser_id', session.advertiserUuid)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: '파트너를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 상태 업데이트
    const { error: updateError } = await supabase
      .from('partners')
      .update({ status })
      .eq('id', id)

    if (updateError) {
      console.error('Partner update error:', updateError)
      return NextResponse.json(
        { error: '파트너 상태 변경에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, status })

  } catch (error) {
    console.error('Partner PATCH error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdvertiserSession()

    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = await createClient()

    const { data: partner, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .eq('advertiser_id', session.advertiserUuid)
      .single()

    if (error || !partner) {
      return NextResponse.json(
        { error: '파트너를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({ partner })

  } catch (error) {
    console.error('Partner GET error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
