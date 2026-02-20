import { NextRequest, NextResponse } from 'next/server';
import { getNaverKeywordStats } from '@/lib/naver-keyword';
import { getGoogleKeywordStats } from '@/lib/google-keyword';
import { upsertKeywordSearchVolume, getLatestKeywordVolume } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/keyword-stats?keyword=xxx — 저장된 최신 검색량 조회
export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get('keyword');
  if (!keyword) {
    return NextResponse.json({ success: false, error: 'keyword 파라미터가 필요합니다.' }, { status: 400 });
  }
  const data = await getLatestKeywordVolume(keyword);
  return NextResponse.json({ success: true, data });
}

// POST /api/keyword-stats — 네이버+구글 검색량 조회 후 Supabase 저장
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { keywords?: string[] };
    const keywords = (body.keywords ?? []).map((k: string) => k.trim()).filter(Boolean);

    if (keywords.length === 0) {
      return NextResponse.json({ success: false, error: '키워드를 1개 이상 입력하세요.' }, { status: 400 });
    }

    const [naverStats, googleMap] = await Promise.all([
      getNaverKeywordStats(keywords),
      getGoogleKeywordStats(keywords),
    ]);

    const results = naverStats.map((stat) => {
      const google = googleMap.get(stat.keyword);
      return {
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
      };
    });

    await Promise.all(results.map(upsertKeywordSearchVolume));

    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    console.error('[keyword-stats] error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
