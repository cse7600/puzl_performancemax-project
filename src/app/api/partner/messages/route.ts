import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 파트너가 속한 프로그램의 메시지 목록
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
      .single()

    if (!partner) {
      return NextResponse.json({ error: '파트너를 찾을 수 없습니다' }, { status: 404 })
    }

    // 파트너가 속한 프로그램의 광고주 ID 목록
    const { data: enrollments } = await supabase
      .from('partner_programs')
      .select('advertiser_id')
      .eq('partner_id', partner.id)
      .eq('status', 'approved')

    const advertiserIds = (enrollments || []).map(e => e.advertiser_id)

    if (advertiserIds.length === 0) {
      return NextResponse.json({ messages: [] })
    }

    // 해당 광고주들의 메시지 조회 (target_type = 'all' 만 우선)
    const { data: messages } = await supabase
      .from('partner_messages')
      .select('*, advertisers!inner(company_name, program_name)')
      .in('advertiser_id', advertiserIds)
      .eq('target_type', 'all')
      .order('sent_at', { ascending: false })

    // 읽음 여부 확인
    const { data: reads } = await supabase
      .from('partner_message_reads')
      .select('message_id')
      .eq('partner_id', partner.id)

    const readMessageIds = new Set((reads || []).map(r => r.message_id))

    const messagesWithReadStatus = (messages || []).map(msg => ({
      ...msg,
      is_read: readMessageIds.has(msg.id),
    }))

    return NextResponse.json({ messages: messagesWithReadStatus })
  } catch (error) {
    console.error('Partner messages GET error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST: 메시지 읽음 처리
export async function POST(request: NextRequest) {
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
      .single()

    if (!partner) {
      return NextResponse.json({ error: '파트너를 찾을 수 없습니다' }, { status: 404 })
    }

    const { message_id } = await request.json()

    if (!message_id) {
      return NextResponse.json({ error: '메시지 ID가 필요합니다' }, { status: 400 })
    }

    await supabase
      .from('partner_message_reads')
      .upsert({
        message_id,
        partner_id: partner.id,
      }, { onConflict: 'message_id,partner_id' })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Partner messages POST error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
