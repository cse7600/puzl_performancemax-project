import { NextRequest, NextResponse } from 'next/server';
import { scrapeNaverAds, detectRankChanges } from '@/lib/scraper';
import {
  saveSnapshot,
  savePrevRankChanges,
  getPreviousSnapshot,
  getDueKeywords,
  updateKeywordLastRun,
  upsertKeywordSearchVolume,
} from '@/lib/supabase';
import { getNaverKeywordStats } from '@/lib/naver-keyword';
import { getGoogleKeywordStats } from '@/lib/google-keyword';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/** 광고 스크래핑 + 순위 변동 저장 */
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

  // 키워드 검색량 수집 (비동기 — 실패해도 스크래핑 결과에 영향 없음)
  fetchAndSaveKeywordVolume(query).catch((err) =>
    console.error('[Scrape] Keyword volume fetch failed:', err)
  );

  return {
    query,
    monitoredAt: result.monitoredAt,
    pc: { count: result.pc.count, snapshotId: pcSnapshotId },
    mobile: { count: result.mobile.count, snapshotId: mobileSnapshotId },
  };
}

/** 키워드 검색량 조회 후 Supabase 저장 */
async function fetchAndSaveKeywordVolume(query: string): Promise<void> {
  const [naverStats, googleMap] = await Promise.all([
    getNaverKeywordStats([query]),
    getGoogleKeywordStats([query]),
  ]);

  for (const stat of naverStats) {
    const google = googleMap.get(stat.keyword);
    await upsertKeywordSearchVolume({
      keyword: stat.keyword,
      pc_volume: stat.pcVolume,
      mobile_volume: stat.mobileVolume,
      total_volume: stat.totalVolume,
      google_volume: google?.googleVolume ?? null,
      google_competition: google?.googleCompetition ?? null,
      competition: stat.competition,
      avg_depth: stat.avgDepth,
      pc_ctr: stat.pcAvgCtr,
      mobile_ctr: stat.mobileAvgCtr,
    });
  }
}

// 수동 단일 키워드 수집
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

// Vercel Cron: 예약된 키워드 순환 수집
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
