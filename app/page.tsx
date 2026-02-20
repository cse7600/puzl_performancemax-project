'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ad, AdSnapshot, MonitorKeyword } from '@/lib/types';
import AdCard from '@/components/AdCard';
import KeywordSidebar from '@/components/KeywordManager';

type Platform = 'pc' | 'mobile';

interface LatestData {
  pc: AdSnapshot | null;
  mobile: AdSnapshot | null;
}

export default function Dashboard() {
  const [query, setQuery] = useState('두쫀쿠 카다이프');
  const [platform, setPlatform] = useState<Platform>('pc');
  const [latestData, setLatestData] = useState<LatestData | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<MonitorKeyword[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadData = useCallback(async (q: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/snapshots?query=${encodeURIComponent(q)}&type=latest`);
      const json = await res.json();
      if (json.success) {
        setLatestData(json.data);
        const ts = json.data.pc?.monitored_at || json.data.mobile?.monitored_at;
        if (ts) setLastUpdated(new Date(ts).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
        else setLastUpdated(null);
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

  useEffect(() => { loadData(query); }, [query, loadData]);
  useEffect(() => { loadKeywords(); }, [loadKeywords]);

  const handleScrape = async () => {
    setIsScraping(true);
    setScrapeMsg('수집 중... (약 60~90초 소요)');
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (json.success) {
        setScrapeMsg(`완료 · PC ${json.pc.count}개 · Mobile ${json.mobile.count}개`);
        await loadData(query);
      } else {
        setScrapeMsg(`오류: ${json.error}`);
      }
    } catch (err) {
      setScrapeMsg(`오류: ${String(err)}`);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSelectKeyword = (kw: string) => {
    setQuery(kw);
  };

  const currentSnapshot = latestData?.[platform];
  const ads: Ad[] = currentSnapshot?.ads || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top header ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Sidebar toggle */}
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

          {/* Current keyword + last updated */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
              {query}
            </span>
            {lastUpdated && (
              <span className="text-xs text-gray-400">마지막: {lastUpdated}</span>
            )}
          </div>

          <div className="flex-1" />

          {/* Scrape button */}
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

        {/* Status bar */}
        {scrapeMsg && (
          <div className={`text-center text-xs py-1.5 px-4 ${
            scrapeMsg.includes('오류') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
          }`}>
            {scrapeMsg}
          </div>
        )}
      </header>

      {/* ── Body: sidebar + main ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        {sidebarOpen && (
          <div className="shrink-0 sticky top-[57px] h-[calc(100vh-57px)] overflow-hidden">
            <KeywordSidebar
              keywords={keywords}
              activeKeyword={query}
              onRefresh={loadKeywords}
              onSelectKeyword={handleSelectKeyword}
            />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-5 py-5 min-w-0">

          {/* Keyword info row (mobile fallback) */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2 md:hidden">
            <span className="font-semibold text-gray-800 text-sm">"{query}"</span>
            {lastUpdated && <span className="text-xs text-gray-400">{lastUpdated}</span>}
          </div>

          {/* PC / Mobile tabs */}
          <div className="flex gap-1 mb-4 bg-white border border-gray-200 rounded-lg p-1 w-fit">
            {(['pc', 'mobile'] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  platform === p
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p === 'pc' ? '💻 PC' : '📱 Mobile'}
                {latestData?.[p] && (
                  <span className="ml-1.5 text-xs opacity-75">({latestData[p]!.ad_count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Ad cards */}
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
              <p className="text-sm mt-1">헤더의 "▶ 지금 수집" 버튼을 눌러 시작하세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {ads.map((ad) => (
                <AdCard key={`${ad.rank}-${ad.advertiser}`} ad={ad} />
              ))}
            </div>
          )}

          {/* Summary table */}
          {!isLoading && ads.length > 0 && (
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">📈 광고주 요약</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 px-2 text-gray-500 font-medium">순위</th>
                      <th className="text-left py-1.5 px-2 text-gray-500 font-medium">광고주</th>
                      <th className="text-left py-1.5 px-2 text-gray-500 font-medium">제목</th>
                      <th className="text-left py-1.5 px-2 text-gray-500 font-medium">서브링크</th>
                      <th className="text-left py-1.5 px-2 text-gray-500 font-medium">이미지</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad) => (
                      <tr key={ad.rank} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-1.5 px-2 font-bold text-blue-600">{ad.rank}</td>
                        <td className="py-1.5 px-2 font-medium text-gray-800">{ad.advertiser}</td>
                        <td className="py-1.5 px-2 text-gray-600 max-w-xs truncate">{ad.title}</td>
                        <td className="py-1.5 px-2 text-gray-500">
                          {ad.subLinks.length > 0 ? `${ad.subLinks.length}개` : '-'}
                        </td>
                        <td className="py-1.5 px-2 text-gray-500">
                          {ad.images.filter(img => img.src.includes('searchad-phinf')).length > 0
                            ? `${ad.images.filter(img => img.src.includes('searchad-phinf')).length}장`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
