'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ad, AdSnapshot, MonitorKeyword } from '@/lib/types';
import AdCard from '@/components/AdCard';
import KeywordManager from '@/components/KeywordManager';

type Platform = 'pc' | 'mobile';

interface LatestData {
  pc: AdSnapshot | null;
  mobile: AdSnapshot | null;
}

export default function Dashboard() {
  const [query, setQuery] = useState('두쫀쿠 카다이프');
  const [inputQuery, setInputQuery] = useState('두쫀쿠 카다이프');
  const [platform, setPlatform] = useState<Platform>('pc');
  const [latestData, setLatestData] = useState<LatestData | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showManager, setShowManager] = useState(false);
  const [keywords, setKeywords] = useState<MonitorKeyword[]>([]);

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

  useEffect(() => {
    loadData(query);
  }, [query, loadData]);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

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
        setScrapeMsg(`완료: PC ${json.pc.count}개, Mobile ${json.mobile.count}개 광고 수집`);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputQuery.trim());
  };

  const handleSelectKeyword = (kw: string) => {
    setQuery(kw);
    setInputQuery(kw);
    setShowManager(false);
  };

  const currentSnapshot = latestData?.[platform];
  const ads: Ad[] = currentSnapshot?.ads || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg font-bold text-gray-900">🔍 네이버 광고 모니터</h1>
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="검색 키워드"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700"
            >
              검색
            </button>
          </form>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManager((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                showManager
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              ⚙️ 캠페인{keywords.length > 0 && ` (${keywords.length})`}
            </button>
            <button
              onClick={handleScrape}
              disabled={isScraping}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        </div>
        {scrapeMsg && (
          <div className={`text-center text-xs py-1.5 px-4 ${scrapeMsg.includes('오류') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {scrapeMsg}
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 캠페인 관리 패널 */}
        {showManager && (
          <KeywordManager
            keywords={keywords}
            onRefresh={loadKeywords}
            onSelectKeyword={handleSelectKeyword}
          />
        )}

        {/* 검색어 + 메타 */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <span className="text-sm text-gray-500">검색어: </span>
            <span className="font-semibold text-gray-800">"{query}"</span>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-400">마지막 수집: {lastUpdated}</span>
          )}
        </div>

        {/* PC / Mobile 탭 */}
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

        {/* 광고 카드 목록 */}
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
            <p className="text-sm mt-1">위의 "▶ 지금 수집" 버튼을 눌러 시작하세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {ads.map((ad) => (
              <AdCard key={`${ad.rank}-${ad.advertiser}`} ad={ad} />
            ))}
          </div>
        )}

        {/* 광고주 요약 테이블 */}
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
  );
}
