import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 인증 없이 서비스 롤 키로 더미 데이터 조회
const DEMO_AD_ACCOUNT_ID = 'bbbbbbbb-0000-0000-0000-000000000001';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const supabase = getServiceClient();

  // 기간: 최근 30일
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  const fromStr = from.toISOString().split('T')[0];
  const toStr   = to.toISOString().split('T')[0];

  // 1. 광고 계정 정보
  const { data: account } = await supabase
    .from('ad_accounts')
    .select('id, name, naver_customer_id, last_synced_at')
    .eq('id', DEMO_AD_ACCOUNT_ID)
    .single();

  // 2. 캠페인 목록
  const { data: campaigns } = await supabase
    .from('naver_campaigns')
    .select('id, name, campaign_type, status, daily_budget')
    .eq('ad_account_id', DEMO_AD_ACCOUNT_ID)
    .is('deleted_at', null);

  // 3. 키워드 목록 (입찰전략 포함, 최대 20개)
  const { data: keywords } = await supabase
    .from('naver_keywords')
    .select(`
      id, keyword_text, bid_amt, status,
      bid_strategies(is_enabled, strategy_type, target_value),
      naver_ad_groups!inner(id, name, naver_campaigns!inner(id, name, ad_account_id))
    `)
    .eq('naver_ad_groups.naver_campaigns.ad_account_id', DEMO_AD_ACCOUNT_ID)
    .is('deleted_at', null)
    .limit(20);

  // 4. 통계 데이터 (키워드 ID 목록)
  const keywordIds = (keywords ?? []).map((k) => k.id);

  const { data: rawStats } = keywordIds.length > 0
    ? await supabase
        .from('keyword_stats')
        .select('keyword_id, stat_date, clicks, cost, conversions, revenue')
        .in('keyword_id', keywordIds)
        .gte('stat_date', fromStr)
        .lte('stat_date', toStr)
    : { data: [] };

  // 날짜별 집계
  const dailyMap = new Map<string, { clicks: number; cost: number; conversions: number; revenue: number }>();
  for (const s of rawStats ?? []) {
    const existing = dailyMap.get(s.stat_date) ?? { clicks: 0, cost: 0, conversions: 0, revenue: 0 };
    dailyMap.set(s.stat_date, {
      clicks:      existing.clicks + Number(s.clicks),
      cost:        existing.cost + Number(s.cost),
      conversions: existing.conversions + Number(s.conversions),
      revenue:     existing.revenue + Number(s.revenue),
    });
  }

  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      clicks:      d.clicks,
      cost:        d.cost,
      conversions: d.conversions,
      cpc:         d.clicks > 0 ? Math.round(d.cost / d.clicks) : 0,
      roas:        d.cost > 0 ? Math.round((d.revenue / d.cost) * 100) / 100 : 0,
    }));

  const totals = daily.reduce(
    (acc, d) => ({
      totalClicks:      acc.totalClicks + d.clicks,
      totalCost:        acc.totalCost + d.cost,
      totalConversions: acc.totalConversions + d.conversions,
      totalRevenue:     acc.totalRevenue + (d.roas * d.cost),
    }),
    { totalClicks: 0, totalCost: 0, totalConversions: 0, totalRevenue: 0 },
  );

  const summary = {
    ...totals,
    avgCpc: totals.totalClicks > 0 ? Math.round(totals.totalCost / totals.totalClicks) : 0,
    roas:   totals.totalCost > 0 ? Math.round((totals.totalRevenue / totals.totalCost) * 100) / 100 : 0,
  };

  // 5. 오늘 키워드별 통계
  const todayStr = toStr;
  const { data: todayStats } = keywordIds.length > 0
    ? await supabase
        .from('keyword_stats')
        .select('keyword_id, clicks, cost')
        .in('keyword_id', keywordIds)
        .eq('stat_date', todayStr)
    : { data: [] };

  const todayMap = new Map((todayStats ?? []).map((s) => [
    s.keyword_id,
    { clicks: Number(s.clicks), cost: Number(s.cost), cpc: Number(s.clicks) > 0 ? Math.round(Number(s.cost) / Number(s.clicks)) : 0 },
  ]));

  const keywordsWithToday = (keywords ?? []).map((kw) => {
    const strategies = Array.isArray(kw.bid_strategies) ? kw.bid_strategies : [kw.bid_strategies].filter(Boolean);
    return {
      id: kw.id,
      keywordText: kw.keyword_text,
      bidAmt: kw.bid_amt,
      status: kw.status,
      strategy: strategies[0] ?? null,
      todayStats: todayMap.get(kw.id) ?? null,
    };
  });

  // 6. 입찰 이력 (최근 15건)
  const { data: bidLogs } = await supabase
    .from('bid_logs')
    .select(`
      id, bid_before, bid_after, reason, status, executed_at,
      naver_keywords!inner(keyword_text)
    `)
    .in('keyword_id', keywordIds)
    .order('executed_at', { ascending: false })
    .limit(15);

  return NextResponse.json({
    account,
    campaigns: campaigns ?? [],
    keywords: keywordsWithToday,
    summary,
    daily,
    bidLogs: (bidLogs ?? []).map((log) => {
      const kwData = log.naver_keywords as unknown as { keyword_text: string };
      return {
        id: log.id,
        keywordText: kwData?.keyword_text ?? '-',
        bidBefore: log.bid_before,
        bidAfter: log.bid_after,
        reason: log.reason,
        status: log.status,
        executedAt: log.executed_at,
      };
    }),
  });
}
