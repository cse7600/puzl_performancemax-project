import { NextRequest, NextResponse } from 'next/server';
import { scrapeNaverAds, detectRankChanges } from '@/lib/scraper';
import {
  saveSnapshot,
  savePrevRankChanges,
  getPreviousSnapshot,
  getDueKeywords,
  updateKeywordLastRun,
} from '@/lib/supabase';

export const maxDuration = 300; // 5분 (여러 키워드 순환)
export const dynamic = 'force-dynamic';

async function runScrape(query: string) {
  const result = await scrapeNaverAds(query);

  const pcSnapshotId = await saveSnapshot(query, 'pc', result.pc.ads, result.monitoredAt);
  const mobileSnapshotId = await saveSnapshot(query, 'mobile', result.mobile.ads, result.monitoredAt);

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

  return {
    query,
    monitoredAt: result.monitoredAt,
    pc: { count: result.pc.count, snapshotId: pcSnapshotId },
    mobile: { count: result.mobile.count, snapshotId: mobileSnapshotId },
  };
}

// Manual single-keyword scrape
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query?.trim() || '두쫀쿠 카다이프';

    console.log(`[Scrape] Manual: ${query}`);
    const result = await runScrape(query);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[Scrape Error]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// Vercel Cron: iterate all due keywords
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dueKeywords = await getDueKeywords();

  if (dueKeywords.length === 0) {
    return NextResponse.json({ success: true, message: 'No keywords due', processed: 0 });
  }

  console.log(`[Cron] Due keywords: ${dueKeywords.map((k) => k.keyword).join(', ')}`);

  const results = [];
  for (const kw of dueKeywords) {
    try {
      console.log(`[Cron] Scraping: ${kw.keyword}`);
      const result = await runScrape(kw.keyword);
      await updateKeywordLastRun(kw.id, result.monitoredAt);
      results.push({ keyword: kw.keyword, success: true, ...result });
    } catch (err) {
      console.error(`[Cron] Failed: ${kw.keyword}`, err);
      results.push({ keyword: kw.keyword, success: false, error: String(err) });
    }
  }

  return NextResponse.json({ success: true, processed: results.length, results });
}
