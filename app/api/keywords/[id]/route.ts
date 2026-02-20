import { NextRequest, NextResponse } from 'next/server';
import { updateKeyword, deleteKeyword } from '@/lib/supabase';
import { MonitorKeyword } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updates: Partial<Pick<MonitorKeyword, 'enabled' | 'interval_hours'>> = {};

    if (typeof body.enabled === 'boolean') updates.enabled = body.enabled;
    if (body.interval_hours !== undefined) {
      const h = Number(body.interval_hours) as MonitorKeyword['interval_hours'];
      if (![1, 3, 6, 12, 24].includes(h)) {
        return NextResponse.json({ success: false, error: '유효하지 않은 수집 주기입니다' }, { status: 400 });
      }
      updates.interval_hours = h;
    }

    const ok = await updateKeyword(id, updates);
    return NextResponse.json({ success: ok });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteKeyword(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
