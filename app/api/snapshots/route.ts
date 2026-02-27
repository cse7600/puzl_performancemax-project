import { NextRequest, NextResponse } from 'next/server';
import { getLatestSnapshots, getSnapshotHistory, getRankChanges } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '두쫀쿠 카다이프';
  const type = searchParams.get('type') || 'latest'; // latest | history | changes

  try {
    if (type === 'latest') {
      const snapshots = await getLatestSnapshots(query);
      return NextResponse.json({ success: true, data: snapshots });
    }

    if (type === 'history') {
      const platform = (searchParams.get('platform') || 'pc') as 'pc' | 'mobile';
      const limit = parseInt(searchParams.get('limit') || '20');
      const history = await getSnapshotHistory(query, platform, limit);
      return NextResponse.json({ success: true, data: history });
    }

    if (type === 'changes') {
      const platform = searchParams.get('platform') || 'pc';
      const limit = parseInt(searchParams.get('limit') || '30');
      const data = await getRankChanges(query, platform, limit);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
