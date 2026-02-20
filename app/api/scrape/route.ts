import { NextRequest, NextResponse } from 'next/server';
import { scrapeNaverAds, detectRankChanges } from '@/lib/scraper';
import { saveSnapshot, savePrevRankChanges, getPreviousSnapshot } from '@/lib/supabase';

export const maxDuration = 120; // 2분 (Vercel Pro 필요, 로컬은 무제한)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || '두쫀쿠 카다이프';

    console.log(`[Scrape] Starting: ${query}`);
    const result = await scrapeNaverAds(query);

    // PC 저장
    const pcSnapshotId = await saveSnapshot(query, 'pc', result.pc.ads, result.monitoredAt);
    // Mobile 저장
    const mobileSnapshotId = await saveSnapshot(query, 'mobile', result.mobile.ads, result.monitoredAt);

    // 순위 변화 감지
    const [prevPc, prevMobile] = await Promise.all([
      getPreviousSnapshot(query, 'pc', result.monitoredAt),
      getPreviousSnapshot(query, 'mobile', result.monitoredAt),
    ]);

    if (pcSnapshotId && prevPc) {
      const changes = detectRankChanges(prevPc.ads, result.pc.ads);
      await savePrevRankChanges(pcSnapshotId, query, 'pc', changes, result.monitoredAt);
    }
    if (mobileSnapshotId && prevMobile) {
      const changes = detectRankChanges(prevMobile.ads, result.mobile.ads);
      await savePrevRankChanges(mobileSnapshotId, query, 'mobile', changes, result.monitoredAt);
    }

    return NextResponse.json({
      success: true,
      query,
      monitoredAt: result.monitoredAt,
      pc: { count: result.pc.count, snapshotId: pcSnapshotId },
      mobile: { count: result.mobile.count, snapshotId: mobileSnapshotId },
    });
  } catch (err) {
    console.error('[Scrape Error]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// Vercel Cron에서 GET 방식으로 호출
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return POST(req);
}
