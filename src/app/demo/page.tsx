'use client';

import { useEffect, useState, useMemo } from 'react';
import { Zap, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/features/naver-ads/components/stat-card';
import { TrendChart } from '@/features/naver-ads/components/trend-chart';

type Campaign = {
  id: string;
  name: string;
  campaign_type: string;
  status: string;
  daily_budget: number;
};

type Keyword = {
  id: string;
  keywordText: string;
  bidAmt: number;
  status: string;
  strategy: { is_enabled: boolean; strategy_type: string; target_value: number } | null;
  todayStats: { clicks: number; cost: number; cpc: number } | null;
};

type BidLog = {
  id: string;
  keywordText: string;
  bidBefore: number;
  bidAfter: number;
  reason: string;
  status: string;
  executedAt: string;
};

type DailyData = { date: string; clicks: number; cost: number; cpc: number };

type DemoData = {
  account: { name: string; naver_customer_id: string; last_synced_at: string } | null;
  campaigns: Campaign[];
  keywords: Keyword[];
  summary: {
    totalClicks: number;
    totalCost: number;
    totalConversions: number;
    avgCpc: number;
    roas: number;
  };
  daily: DailyData[];
  bidLogs: BidLog[];
};

const PERIOD_OPTIONS = [
  { label: '7일',  days: 7  },
  { label: '14일', days: 14 },
  { label: '30일', days: 30 },
];

function filterDailyByPeriod(daily: DailyData[], days: number): DailyData[] {
  return daily.slice(-days);
}

function calcSummary(daily: DailyData[]) {
  const totalClicks = daily.reduce((s, d) => s + d.clicks, 0);
  const totalCost   = daily.reduce((s, d) => s + d.cost, 0);
  return {
    totalClicks,
    totalCost,
    avgCpc: totalClicks > 0 ? Math.round(totalCost / totalClicks) : 0,
  };
}

export default function DemoPage() {
  const [data, setData]       = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState(7);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/demo')
      .then((r) => r.json())
      .then((json: DemoData) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDaily = useMemo(
    () => filterDailyByPeriod(data?.daily ?? [], period),
    [data?.daily, period],
  );

  const periodSummary = useMemo(() => calcSummary(filteredDaily), [filteredDaily]);

  const activeKeywords  = data?.keywords.filter((k) => k.status === 'ELIGIBLE') ?? [];
  const strategyEnabled = data?.keywords.filter((k) => k.strategy?.is_enabled) ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">AdPilot</span>
            <Badge variant="secondary" className="text-xs ml-1">데모</Badge>
          </div>
          <div className="flex items-center gap-3">
            {data?.account && (
              <span className="text-xs text-slate-500 hidden sm:block">
                고객 ID: {data.account.naver_customer_id} · 마지막 동기화: {new Date(data.account.last_synced_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* 데모 배너 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <p className="text-sm text-blue-700">
            <span className="font-semibold">데모 모드</span> — 실제 광고 계정({data?.account?.name ?? '경정청구 서비스 계정'})의 더미 데이터를 표시합니다. 로그인 없이 모든 기능을 미리 확인할 수 있습니다.
          </p>
        </div>

        {/* 대시보드 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">성과 대시보드</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              활성 키워드 {activeKeywords.length}개 · 자동입찰 전략 {strategyEnabled.length}개 운영중
            </p>
          </div>
          {/* 기간 선택 */}
          <div className="flex rounded-lg border overflow-hidden">
            {PERIOD_OPTIONS.map((o) => (
              <button
                key={o.days}
                onClick={() => setPeriod(o.days)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  period === o.days
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* 요약 지표 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard title="총 클릭" value={periodSummary.totalClicks} loading={loading} />
          <StatCard title="총 비용" value={periodSummary.totalCost} unit="원" loading={loading} highlight />
          <StatCard title="전환수" value={data?.summary.totalConversions ?? 0} loading={loading} />
          <StatCard title="평균 CPC" value={periodSummary.avgCpc} unit="원" loading={loading} />
          <StatCard title="ROAS" value={data?.summary.roas ?? 0} unit="배" loading={loading} highlight />
        </div>

        {/* 트렌드 차트 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">기간별 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={filteredDaily} loading={loading} />
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 캠페인 현황 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">캠페인 현황</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-sm text-slate-400">불러오는 중...</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {(data?.campaigns ?? []).map((c) => (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.campaign_type}</p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-xs text-slate-400">일예산</p>
                          <p className="text-sm font-medium text-slate-700">
                            {c.daily_budget > 0 ? `${c.daily_budget.toLocaleString('ko-KR')}원` : '무제한'}
                          </p>
                        </div>
                        <Badge variant={c.status === 'ELIGIBLE' ? 'default' : 'secondary'} className="text-xs">
                          {c.status === 'ELIGIBLE' ? '운영중' : '일시중지'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 키워드 현황 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">주요 키워드 현황 (오늘)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-sm text-slate-400">불러오는 중...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">키워드</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">입찰가</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">클릭</th>
                        <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-500">전략</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data?.keywords.slice(0, 8) ?? []).map((kw) => (
                        <tr key={kw.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[140px] truncate">
                            {kw.keywordText}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-600 text-xs">
                            {kw.bidAmt.toLocaleString('ko-KR')}원
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-600 text-xs">
                            {kw.todayStats?.clicks?.toLocaleString('ko-KR') ?? '-'}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {kw.strategy ? (
                              <Badge
                                variant={kw.strategy.is_enabled ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {kw.strategy.is_enabled ? '활성' : '비활성'}
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-400">미설정</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 입찰 이력 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">자동 입찰 이력</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">불러오는 중...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">키워드</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">이전</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">변경</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 hidden md:table-cell">사유</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-500">결과</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 hidden sm:table-cell">시각</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.bidLogs ?? []).map((log) => {
                      const diff = log.bidAfter - log.bidBefore;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800 max-w-[120px] truncate">
                            {log.keywordText}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 text-xs">
                            {log.bidBefore.toLocaleString('ko-KR')}원
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-medium">
                            <span className={diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-red-500' : 'text-slate-400'}>
                              {diff > 0 ? '▲ ' : diff < 0 ? '▼ ' : '—'}{Math.abs(diff).toLocaleString('ko-KR')}원
                            </span>
                            <div className="text-slate-500 font-normal">{log.bidAfter.toLocaleString('ko-KR')}원</div>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell max-w-[240px] truncate">
                            {log.reason}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant={log.status === 'success' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {log.status === 'success' ? '성공' : '실패'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-400 hidden sm:table-cell whitespace-nowrap">
                            {new Date(log.executedAt).toLocaleString('ko-KR', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white text-center">
          <h2 className="text-lg font-bold mb-1">지금 바로 시작하세요</h2>
          <p className="text-blue-100 text-sm mb-4">네이버 광고 API 키만 등록하면 자동 입찰이 즉시 시작됩니다</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-blue-50 transition-colors"
          >
            무료로 시작하기 (14일 트라이얼)
          </a>
        </div>
      </main>
    </div>
  );
}
