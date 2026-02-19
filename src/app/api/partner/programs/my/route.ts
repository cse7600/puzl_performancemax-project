import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 내 참가 프로그램 목록 (대시보드 스위처용)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!partner) {
      return NextResponse.json({ error: '파트너를 찾을 수 없습니다' }, { status: 404 })
    }

    const { data: programs, error } = await supabase
      .from('partner_programs')
      .select(`
        *,
        advertisers!inner(
          id,
          company_name,
          program_name,
          logo_url,
          primary_color
        )
      `)
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('My programs query error:', error)
      return NextResponse.json({ error: '프로그램 목록 조회에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ programs: programs || [] })
  } catch (error) {
    console.error('My programs GET error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
