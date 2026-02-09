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

    // 권한 확인
    if (!canManage(session)) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { contract_status, is_valid, sales_rep } = body

    const supabase = await createClient()

    // 해당 광고주의 피추천인인지 확인
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('id, advertiser_id, partner_id')
      .eq('id', id)
      .eq('advertiser_id', session.advertiserUuid)
      .single()

    if (referralError || !referral) {
      return NextResponse.json(
        { error: '고객을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {}

    if (contract_status !== undefined) {
      const validStatuses = ['pending', 'call_1', 'call_2', 'call_3', 'completed', 'invalid', 'duplicate']
      if (!validStatuses.includes(contract_status)) {
        return NextResponse.json(
          { error: '유효하지 않은 계약 상태입니다' },
          { status: 400 }
        )
      }
      updateData.contract_status = contract_status

      // 계약 완료 시 날짜 자동 설정
      if (contract_status === 'completed') {
        updateData.contracted_at = new Date().toISOString()
      }
    }

    if (is_valid !== undefined) {
      if (is_valid !== null && typeof is_valid !== 'boolean') {
        return NextResponse.json(
          { error: '유효 여부는 boolean 또는 null이어야 합니다' },
          { status: 400 }
        )
      }
      updateData.is_valid = is_valid
    }

    if (sales_rep !== undefined) {
      updateData.sales_rep = sales_rep
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 내용이 없습니다' },
        { status: 400 }
      )
    }

    // 업데이트 실행
    const { error: updateError } = await supabase
      .from('referrals')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Referral update error:', updateError)
      return NextResponse.json(
        { error: '고객 정보 수정에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, updated: updateData })

  } catch (error) {
    console.error('Referral PATCH error:', error)
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

    const { data: referral, error } = await supabase
      .from('referrals')
      .select(`
        *,
        partners (
          id,
          name,
          referral_code,
          email
        )
      `)
      .eq('id', id)
      .eq('advertiser_id', session.advertiserUuid)
      .single()

    if (error || !referral) {
      return NextResponse.json(
        { error: '고객을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({ referral })

  } catch (error) {
    console.error('Referral GET error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
