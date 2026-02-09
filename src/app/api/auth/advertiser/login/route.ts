import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'User ID and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 광고주 조회
    const { data: advertiser, error: fetchError } = await supabase
      .from('advertisers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError || !advertiser) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, advertiser.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // 계정 상태 확인
    if (advertiser.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      )
    }

    // 세션 토큰 생성
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7일 유효

    // 세션 저장
    const { error: sessionError } = await supabase
      .from('advertiser_sessions')
      .insert({
        advertiser_id: advertiser.id,
        token,
        expires_at: expiresAt.toISOString(),
      })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // 응답에 쿠키 설정
    const response = NextResponse.json({
      success: true,
      advertiser: {
        id: advertiser.id,
        advertiserId: advertiser.advertiser_id,
        companyName: advertiser.company_name,
        userId: advertiser.user_id,
        logoUrl: advertiser.logo_url,
        primaryColor: advertiser.primary_color,
      },
    })

    // HttpOnly 쿠키로 토큰 저장
    response.cookies.set('advertiser_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
