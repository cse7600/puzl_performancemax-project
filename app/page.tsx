'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ad, AdSnapshot, MonitorKeyword, RankChange, KeywordSearchVolume } from '@/lib/types';
import AdCard from '@/components/AdCard';
import KeywordSidebar from '@/components/KeywordManager';

type Platform = 'pc' | 'mobile';

interface LatestData {
  pc: AdSnapshot | null;
  mobile: AdSnapshot | null;
}

const CHANGE_BADGE: Record<string, { label: string; cls: string }> = {
  new:     { label: 'NEW',  cls: 'bg-green-100 text-green-700' },
  removed: { label: '제거', cls: 'bg-red-100 text-red-700' },
  up:      { label: '▲',   cls: 'bg-blue-100 text-blue-700' },
  down:    { label: '▼',   cls: 'bg-orange-100 text-orange-700' },
  same:    { label: '━',   cls: 'bg-gray-100 text-gray-500' },
};

export default function Dashboard() {
  const [query, setQuery] = useState('두쫀쿠 카다이프');
  const [platform, setPlatform] = useState<Platform>('pc');
  const [latestData, setLatestData] = useState<LatestData | null>(null);
  const [rankChanges, setRankChanges] = useState<RankChange[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<MonitorKeyword[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchVolume, setSearchVolume] = useState<KeywordSearchVolume | null>(null);
  const [volumeLoading, setVolumeLoading] = useState(false);

  const loadData = useCallback(async (q: string, p: Platform) => {
    setIsLoading(true);
    try {
      const [snapRes, changesRes] = await Promise.all([
        fetch(`/api/snapshots?query=${encodeURIComponent(q)}&type=latest`),
        fetch(`/api/snapshots?query=${encodeURIComponent(q)}&type=changes&platform=${p}&limit=30`),
      ]);
      const [snapJson, changesJson] = await Promise.all([snapRes.json(), changesRes.json()]);

      if (snapJson.success) {
        setLatestData(snapJson.data);
        const ts = snapJson.data.pc?.monitored_at || snapJson.data.mobile?.monitored_at;
        setLastUpdated(ts ? new Date(ts).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : null);
      }
      if (changesJson.success) {
        const seen = new Set<string>();
        const latest: RankChange[] = [];
        for (const c of (changesJson.data ?? [])) {
          if (!seen.has(c.advertiser)) { seen.add(c.advertiser); latest.push(c); }
        }
        setRankChanges(latest);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadKeywords = useCallback(async () => {
    try {
      const res = await fetch('/api/keywords');
      const json = await res.json();
      if (json.success) setKeywords(json.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadSearchVolume = useCallback(async (q: string) => {
    setVolumeLoading(true);
    setSearchVolume(null);
    try {
      const res = await fetch(`/api/keyword-stats?keyword=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success && json.data) setSearchVolume(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setVolumeLoading(false);
    }
  }, []);

  useEffect(() => { loadData(query, platform); }, [query, platform, loadData]);
  useEffect(() => { loadKeywords(); }, [loadKeywords]);
  useEffect(() => { loadSearchVolume(query); }, [query, loadSearchVolume]);

  const handleScrape = async () => {
    setIsScraping(true);
    setScrapeMsg('수집 요청 중...');
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (json.success && json.queued) {
        // GitHub Actions 비동기 실행 — 약 2~3분 후 결과 반영
        setScrapeMsg('✅ 수집 시작됨. 2~3분 후 자동으로 새로고침됩니다.');
        setTimeout(async () => {
          await loadData(query, platform);
          await loadSearchVolume(query);
          setScrapeMsg('');
        }, 180000); // 3분
      } else {
        setScrapeMsg(`오류: ${json.error}`);
      }
    } catch (err) {
      setScrapeMsg(`오류: ${String(err)}`);
    } finally {
      setIsScraping(false);
    }
  };

  const currentSnapshot = latestData?.[platform];
  const ads: Ad[] = currentSnapshot?.ads || [];
  const changeMap = new Map(rankChanges.map((c) => [c.advertiser, c]));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-gray-500 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="캠페인 사이드바"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-base font-bold text-gray-900 shrink-0">🔍 네이버 광고 모니터</h1>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
              {query}
            </span>
            {lastUpdated && (
              <span className="text-xs text-gray-400">마지막: {lastUpdated}</span>
            )}
          </div>

          <div className="flex-1" />

          <button
            onClick={handleScrape}
            disabled={isScraping}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
          >
            {isScraping ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                수집 중...
              </>
            ) : '▶ 지금 수집'}
          </button>
        </div>

        {scrapeMsg && (
          <div className={`text-center text-xs py-1.5 px-4 ${
            scrapeMsg.includes('오류') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
          }`}>
            {scrapeMsg}
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="shrink-0 sticky top-[57px] h-[calc(100vh-57px)] overflow-hidden">
            <KeywordSidebar
              keywords={keywords}
              activeKeyword={query}
              onRefresh={loadKeywords}
              onSelectKeyword={setQuery}
              activeSection="monitor"
            />
          </div>
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-5 py-5 min-w-0">

          {/* ── 키워드 검색량 요약 카드 ── */}
          <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700">🔢 키워드 월간 검색량</h2>
              {searchVolume && (
                <span className="text-xs text-gray-400">
                  {new Date(searchVolume.fetched_at).toLocaleDateString('ko-KR')} 기준
                </span>
              )}
            </div>

            {volumeLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                검색량 불러오는 중...
              </div>
            ) : searchVolume ? (
              <div className="flex flex-wrap gap-3">
                <VolumeChip label="네이버 PC" value={searchVolume.pc_volume} color="blue" />
                <VolumeChip label="네이버 모바일" value={searchVolume.mobile_volume} color="blue" />
                <VolumeChip label="네이버 합계" value={searchVolume.total_volume} color="indigo" bold />
                {searchVolume.google_volume !== null && (
                  <VolumeChip label="구글" value={searchVolume.google_volume} color="green" />
                )}
                {searchVolume.competition && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500">경쟁도</span>
                    <span className="text-xs font-semibold text-gray-700">{searchVolume.competition}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                아직 수집된 검색량이 없습니다.
                <span className="ml-1 text-blue-500 cursor-pointer hover:underline"
                  onClick={handleScrape}>
                  ▶ 지금 수집
                </span>
                을 누르면 광고 수집과 함께 자동으로 저장됩니다.
              </p>
            )}
          </div>

          {/* PC / Mobile tabs */}
          <div className="flex gap-1 mb-4 bg-white border border-gray-200 rounded-lg p-1 w-fit">
            {(['pc', 'mobile'] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  platform === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p === 'pc' ? '💻 PC' : '📱 Mobile'}
                {latestData?.[p] && (
                  <span className="ml-1.5 text-xs opacity-75">({latestData[p]!.ad_count})</span>
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48 text-gray-400">
              <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              불러오는 중...
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📊</p>
              <p className="font-medium">아직 수집된 데이터가 없습니다</p>
              <p className="text-sm mt-1">"▶ 지금 수집" 버튼을 눌러 시작하세요</p>
            </div>
          ) : (
            <>
              {/* ── 광고주 순위 테이블 ── */}
              <div className="mb-5 bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">📈 광고주 순위 현황</h2>
                  {rankChanges.length > 0 && (
                    <span className="text-xs text-gray-400">직전 수집 대비 변동 표시</span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-1.5 px-2 text-gray-500 font-medium w-10">순위</th>
                        <th className="text-left py-1.5 px-2 text-gray-500 font-medium">광고주</th>
                        <th className="text-left py-1.5 px-2 text-gray-500 font-medium">제목</th>
                        <th className="text-center py-1.5 px-2 text-gray-500 font-medium w-16">변동</th>
                        <th className="text-center py-1.5 px-2 text-gray-500 font-medium w-14">서브링크</th>
                        <th className="text-center py-1.5 px-2 text-gray-500 font-medium w-12">이미지</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ads.map((ad) => {
                        const change = changeMap.get(ad.advertiser);
                        const badge = change ? CHANGE_BADGE[change.change_type] : null;
                        return (
                          <tr key={ad.rank} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-1.5 px-2 font-bold text-blue-600 text-center">{ad.rank}</td>
                            <td className="py-1.5 px-2 font-semibold text-gray-800">{ad.advertiser}</td>
                            <td className="py-1.5 px-2 text-gray-600 max-w-xs truncate">{ad.title}</td>
                            <td className="py-1.5 px-2 text-center">
                              {badge ? (
                                <span className={`inline-block px-1.5 py-0.5 rounded font-medium ${badge.cls}`}>
                                  {badge.label}
                                  {change?.prev_rank && change.change_type !== 'same' && change.change_type !== 'new'
                                    ? ` ${change.prev_rank}위`
                                    : ''}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-center text-gray-500">
                              {ad.subLinks.length > 0 ? `${ad.subLinks.length}개` : '-'}
                            </td>
                            <td className="py-1.5 px-2 text-center text-gray-500">
                              {ad.images.filter(img => img.src.includes('searchad-phinf')).length > 0
                                ? `${ad.images.filter(img => img.src.includes('searchad-phinf')).length}장`
                                : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 광고 카드 ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {ads.map((ad) => {
                  const change = changeMap.get(ad.advertiser);
                  return (
                    <AdCard
                      key={`${ad.rank}-${ad.advertiser}`}
                      ad={ad}
                      rankChange={change ? { type: change.change_type, prevRank: change.prev_rank } : undefined}
                    />
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function VolumeChip({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  const colorCls =
    color === 'indigo' ? 'bg-indigo-50 border-indigo-200' :
    color === 'green'  ? 'bg-green-50 border-green-200' :
    'bg-blue-50 border-blue-200';
  const textCls =
    color === 'indigo' ? 'text-indigo-700' :
    color === 'green'  ? 'text-green-700' :
    'text-blue-700';
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${colorCls}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs ${bold ? 'font-bold text-sm' : 'font-semibold'} ${textCls}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
