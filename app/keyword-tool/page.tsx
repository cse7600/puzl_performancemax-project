'use client';

import { useState, useCallback } from 'react';
import { MonitorKeyword, KeywordSearchVolume } from '@/lib/types';
import KeywordSidebar from '@/components/KeywordManager';

export default function KeywordToolPage() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<KeywordSearchVolume[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<MonitorKeyword[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadKeywords = useCallback(async () => {
    try {
      const res = await fetch('/api/keywords');
      const json = await res.json();
      if (json.success) setKeywords(json.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleQuery = async () => {
    const kws = input
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter(Boolean);

    if (kws.length === 0) {
      setError('키워드를 입력하세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/keyword-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: kws }),
      });
      const json = await res.json();
      if (json.success) {
        setResults(json.data);
      } else {
        setError(json.error || '조회 실패');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCsv = () => {
    const header = ['키워드', 'PC 검색수', '모바일 검색수', '총 검색수', '구글 검색수', '네이버 경쟁도', '구글 경쟁도', '월평균 노출광고수'];
    const rows = results.map((r) => [
      r.keyword,
      r.pc_volume,
      r.mobile_volume,
      r.total_volume,
      r.google_volume ?? '',
      r.competition,
      r.google_competition ?? '',
      r.avg_depth,
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyword_stats_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-gray-500 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-900">📊 키워드 검색량 조회</h1>
          <div className="flex-1" />
          <p className="hidden md:block text-xs text-gray-400">네이버 검색광고 API + Google Ads API 기반</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="shrink-0 sticky top-[57px] h-[calc(100vh-57px)] overflow-hidden">
            <KeywordSidebar
              keywords={keywords}
              activeKeyword=""
              onRefresh={loadKeywords}
              onSelectKeyword={() => {}}
              activeSection="keyword-tool"
            />
          </div>
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-5 py-5 min-w-0">
          {/* Input */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              조회할 키워드 입력
              <span className="ml-1.5 text-xs font-normal text-gray-400">(쉼표 또는 줄바꿈으로 구분, 최대 100개)</span>
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={'퍼포먼스마케팅\n검색광고\n네이버광고'}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-400">
                {input.split(/[\n,]+/).filter((k) => k.trim()).length}개 입력됨
              </span>
              <button
                onClick={handleQuery}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    조회 중...
                  </>
                ) : '🔍 검색량 조회'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">
                  조회 결과 <span className="text-blue-600">{results.length}개</span>
                </h2>
                <button
                  onClick={downloadCsv}
                  className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  ⬇ CSV 다운로드
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left py-2 px-2 text-gray-500 font-semibold">키워드</th>
                      <th className="text-right py-2 px-2 text-gray-500 font-semibold">PC</th>
                      <th className="text-right py-2 px-2 text-gray-500 font-semibold">모바일</th>
                      <th className="text-right py-2 px-2 text-blue-600 font-semibold">총합</th>
                      <th className="text-right py-2 px-2 text-gray-500 font-semibold">구글</th>
                      <th className="text-center py-2 px-2 text-gray-500 font-semibold">N 경쟁도</th>
                      <th className="text-center py-2 px-2 text-gray-500 font-semibold">G 경쟁도</th>
                      <th className="text-right py-2 px-2 text-gray-500 font-semibold">노출광고수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .slice()
                      .sort((a, b) => b.total_volume - a.total_volume)
                      .map((r) => (
                        <tr key={r.keyword} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-2 font-medium text-gray-800">{r.keyword}</td>
                          <td className="py-2 px-2 text-right text-gray-600">{r.pc_volume.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right text-gray-600">{r.mobile_volume.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right font-bold text-blue-600">{r.total_volume.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right text-gray-500">
                            {r.google_volume !== null ? r.google_volume.toLocaleString() : <span className="text-gray-300">-</span>}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <CompBadge value={r.competition} />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <CompBadge value={r.google_competition ?? '-'} />
                          </td>
                          <td className="py-2 px-2 text-right text-gray-500">{r.avg_depth || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {results.length === 0 && !isLoading && !error && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📊</p>
              <p className="font-medium">키워드를 입력하고 조회 버튼을 누르세요</p>
              <p className="text-sm mt-1">네이버 월간검색수 + 구글 검색량을 한 번에 확인합니다</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CompBadge({ value }: { value: string }) {
  const cls =
    value === '높음' ? 'bg-red-100 text-red-600' :
    value === '중간' ? 'bg-yellow-100 text-yellow-600' :
    value === '낮음' ? 'bg-green-100 text-green-600' :
    'bg-gray-100 text-gray-400';
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>
      {value || '-'}
    </span>
  );
}
