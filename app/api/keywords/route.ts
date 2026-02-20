import { NextRequest, NextResponse } from 'next/server';
import { getKeywords, addKeyword } from '@/lib/supabase';
import { MonitorKeyword } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const keywords = await getKeywords();
  return NextResponse.json({ success: true, data: keywords });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const keyword = body.keyword?.trim();
    const interval_hours = Number(body.interval_hours) as MonitorKeyword['interval_hours'];

    if (!keyword) {
      return NextResponse.json({ success: false, error: '키워드를 입력하세요' }, { status: 400 });
    }
    if (![1, 3, 6, 12, 24].includes(interval_hours)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 수집 주기입니다' }, { status: 400 });
    }

    const result = await addKeyword(keyword, interval_hours);
    if (!result) {
      return NextResponse.json({ success: false, error: '이미 등록된 키워드이거나 저장 오류입니다' }, { status: 409 });
    }
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
