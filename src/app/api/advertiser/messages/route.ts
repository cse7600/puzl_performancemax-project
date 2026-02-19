import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdvertiserSession } from '@/lib/auth'

// GET: 광고주가 보낸 메시지 목록
export async function GET() {
  try {
    const session = await getAdvertiserSession()
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: messages } = await supabase
      .from('partner_messages')
      .select('*')
      .eq('advertiser_id', session.advertiserUuid)
      .order('sent_at', { ascending: false })

    // 각 메시지의 읽음 수 조회
    const messagesWithReads = await Promise.all(
      (messages || []).map(async (msg) => {
        const { count } = await supabase
          .from('partner_message_reads')
          .select('id', { count: 'exact', head: true })
          .eq('message_id', msg.id)

        return { ...msg, read_count: count || 0 }
      })
    )

    return NextResponse.json({ messages: messagesWithReads })
  } catch (error) {
    console.error('Advertiser messages GET error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST: 새 메시지 발송
export async function POST(request: NextRequest) {
  try {
    const session = await getAdvertiserSession()
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const supabase = await createClient()

    const { title, body, target_type } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ error: '제목과 본문을 입력해주세요' }, { status: 400 })
    }

    const { data: message, error: insertError } = await supabase
      .from('partner_messages')
      .insert({
        advertiser_id: session.advertiserUuid,
        title,
        body,
        target_type: target_type || 'all',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Message insert error:', insertError)
      return NextResponse.json({ error: '메시지 발송에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Advertiser messages POST error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
