import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdvertiserSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getAdvertiserSession()

    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 8자 이상이어야 합니다' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 현재 비밀번호 확인 - advertiser_users 먼저 시도
    const { data: user } = await supabase
      .from('advertiser_users')
      .select('id, password_hash')
      .eq('id', session.id)
      .single()

    if (user) {
      const isValid = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isValid) {
        return NextResponse.json(
          { error: '현재 비밀번호가 올바르지 않습니다' },
          { status: 400 }
        )
      }

      const newHash = await bcrypt.hash(newPassword, 10)
      const { error: updateError } = await supabase
        .from('advertiser_users')
        .update({ password_hash: newHash })
        .eq('id', session.id)

      if (updateError) {
        return NextResponse.json(
          { error: '비밀번호 변경에 실패했습니다' },
          { status: 500 }
        )
      }
    } else {
      // 레거시 advertisers 테이블
      const { data: adv } = await supabase
        .from('advertisers')
        .select('id, password_hash')
        .eq('advertiser_id', session.advertiserId)
        .single()

      if (!adv) {
        return NextResponse.json(
          { error: '계정을 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      const isValid = await bcrypt.compare(currentPassword, adv.password_hash)
      if (!isValid) {
        return NextResponse.json(
          { error: '현재 비밀번호가 올바르지 않습니다' },
          { status: 400 }
        )
      }

      const newHash = await bcrypt.hash(newPassword, 10)
      const { error: updateError } = await supabase
        .from('advertisers')
        .update({ password_hash: newHash })
        .eq('id', adv.id)

      if (updateError) {
        return NextResponse.json(
          { error: '비밀번호 변경에 실패했습니다' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
