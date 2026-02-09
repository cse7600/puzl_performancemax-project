import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('advertiser_token')?.value

    if (token) {
      const supabase = await createClient()

      // 세션 삭제
      await supabase
        .from('advertiser_sessions')
        .delete()
        .eq('token', token)
    }

    // 쿠키 삭제
    const response = NextResponse.json({ success: true })
    response.cookies.delete('advertiser_token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
