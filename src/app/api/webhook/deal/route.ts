import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// HMAC-SHA256 서명 검증
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// 딜(계약) 웹훅 - 리캐치/세일즈맵에서 계약 완료 시 호출
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')
    const signature = request.headers.get('X-Webhook-Signature')
    const timestamp = request.headers.get('X-Webhook-Timestamp')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 키가 필요합니다' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // API 키로 웹훅 통합 설정 조회
    const { data: integration, error: integrationError } = await supabase
      .from('webhook_integrations')
      .select('*, advertisers!inner(id, advertiser_id)')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (integrationError || !integration) {
      await supabase.from('api_usage_logs').insert({
        source_type: 'webhook',
        endpoint: '/api/webhook/deal',
        method: 'POST',
        status_code: 401,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent'),
      })

      return NextResponse.json(
        { error: '유효하지 않은 API 키입니다' },
        { status: 401 }
      )
    }

    const rawBody = await request.text()

    // 서명 검증
    if (integration.api_secret && signature) {
      if (!verifySignature(rawBody, signature, integration.api_secret)) {
        return NextResponse.json(
          { error: '서명 검증 실패' },
          { status: 401 }
        )
      }
    }

    // 타임스탬프 검증
    if (timestamp) {
      const requestTime = parseInt(timestamp)
      const currentTime = Math.floor(Date.now() / 1000)
      if (Math.abs(currentTime - requestTime) > 300) {
        return NextResponse.json(
          { error: '요청 시간이 만료되었습니다' },
          { status: 401 }
        )
      }
    }

    const body = JSON.parse(rawBody)

    // 필수 필드 검증
    const { referral_id, phone, status, contracted_at, sales_rep } = body

    // referral_id 또는 phone으로 리드 조회
    let referral = null

    if (referral_id) {
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('id', referral_id)
        .eq('advertiser_id', integration.advertiser_id)
        .single()
      referral = data
    } else if (phone) {
      // 연락처로 최근 리드 조회
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('phone', phone)
        .eq('advertiser_id', integration.advertiser_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      referral = data
    }

    if (!referral) {
      await supabase.from('api_usage_logs').insert({
        source_type: 'webhook',
        source_id: integration.id,
        endpoint: '/api/webhook/deal',
        method: 'POST',
        status_code: 404,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        request_body: { referral_id, phone: '***masked***', status },
        response_summary: 'referral_not_found',
      })

      return NextResponse.json(
        { error: '해당 리드를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 계약 상태 매핑
    const statusMapping: Record<string, string> = {
      'completed': 'completed',
      'contracted': 'completed',
      'won': 'completed',
      'invalid': 'invalid',
      'lost': 'invalid',
      'duplicate': 'duplicate',
    }

    const contractStatus = statusMapping[status?.toLowerCase()] || status || 'completed'

    // 리드 상태 업데이트
    const updateData: Record<string, unknown> = {
      contract_status: contractStatus,
    }

    if (contracted_at) {
      updateData.contracted_at = contracted_at
    } else if (contractStatus === 'completed') {
      updateData.contracted_at = new Date().toISOString()
    }

    if (sales_rep) {
      updateData.sales_rep = sales_rep
    }

    // 유효 판정 (계약 완료 시)
    if (contractStatus === 'completed') {
      updateData.is_valid = true
    } else if (contractStatus === 'invalid' || contractStatus === 'duplicate') {
      updateData.is_valid = false
    }

    const { error: updateError } = await supabase
      .from('referrals')
      .update(updateData)
      .eq('id', referral.id)

    if (updateError) {
      console.error('Referral update error:', updateError)
      return NextResponse.json(
        { error: '리드 상태 업데이트에 실패했습니다' },
        { status: 500 }
      )
    }

    // 정산 자동 생성 (계약 완료 + 파트너가 있는 경우)
    // 트리거에서 처리되므로 여기서는 로그만 기록

    // API 사용량 로그 (성공)
    await supabase.from('api_usage_logs').insert({
      source_type: 'webhook',
      source_id: integration.id,
      endpoint: '/api/webhook/deal',
      method: 'POST',
      status_code: 200,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent'),
      request_body: { referral_id: referral.id, status: contractStatus },
      response_summary: `updated_to: ${contractStatus}`,
    })

    return NextResponse.json({
      success: true,
      referral_id: referral.id,
      new_status: contractStatus,
      partner_id: referral.partner_id,
    })

  } catch (error) {
    console.error('Webhook deal error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Webhook-Signature, X-Webhook-Timestamp',
    },
  })
}
