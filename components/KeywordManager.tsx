'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MonitorKeyword } from '@/lib/types';

const INTERVAL_OPTIONS: { value: MonitorKeyword['interval_hours']; label: string }[] = [
  { value: 1, label: '1h' },
  { value: 3, label: '3h' },
  { value: 6, label: '6h' },
  { value: 12, label: '12h' },
  { value: 24, label: '24h' },
];

function nextRunLabel(kw: MonitorKeyword): string {
  if (!kw.enabled) return '비활성';
  if (!kw.last_run_at) return '미수집';
  const next = new Date(kw.last_run_at).getTime() + kw.interval_hours * 3600 * 1000;
  const diff = next - Date.now();
  if (diff <= 0) return '수집 대기';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function isDue(kw: MonitorKeyword): boolean {
  if (!kw.enabled) return false;
  if (!kw.last_run_at) return true;
  return (Date.now() - new Date(kw.last_run_at).getTime()) / 3600000 >= kw.interval_hours;
}

interface Props {
  keywords: MonitorKeyword[];
  activeKeyword: string;
  onRefresh: () => void;
  onSelectKeyword: (keyword: string) => void;
  activeSection?: 'monitor' | 'keyword-tool';
}

export default function KeywordSidebar({
  keywords,
  activeKeyword,
  onRefresh,
  onSelectKeyword,
  activeSection = 'monitor',
}: Props) {
  const [newKeyword, setNewKeyword] = useState('');
  const [newInterval, setNewInterval] = useState<MonitorKeyword['interval_hours']>(6);
  const [isAdding, setIsAdding] = useState(false);
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim(), interval_hours: newInterval }),
      });
      const json = await res.json();
      if (json.success) {
        setNewKeyword('');
        onRefresh();
      } else {
        alert(json.error || '등록 실패');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent, kw: MonitorKeyword) => {
    e.stopPropagation();
    await fetch(`/api/keywords/${kw.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !kw.enabled }),
    });
    onRefresh();
  };

  const handleIntervalChange = async (kw: MonitorKeyword, val: string) => {
    await fetch(`/api/keywords/${kw.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval_hours: Number(val) }),
    });
    onRefresh();
  };

  const handleDelete = async (e: React.MouseEvent, kw: MonitorKeyword) => {
    e.stopPropagation();
    if (!confirm(`"${kw.keyword}" 삭제할까요?`)) return;
    await fetch(`/api/keywords/${kw.id}`, { method: 'DELETE' });
    onRefresh();
  };

  const handleManualRun = async (e: React.MouseEvent, kw: MonitorKeyword) => {
    e.stopPropagation();
    setScrapingId(kw.id);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: kw.keyword }),
      });
      const json = await res.json();
      if (json.success) {
        onSelectKeyword(kw.keyword);
        onRefresh();
      } else {
        alert(`수집 실패: ${json.error}`);
      }
    } finally {
      setScrapingId(null);
    }
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-white border-r border-gray-200 h-full">
      {/* ── 섹션 탭 네비게이션 ── */}
      <div className="flex border-b border-gray-200 shrink-0">
        <Link
          href="/"
          className={`flex-1 py-2.5 text-xs text-center font-semibold transition-colors ${
            activeSection === 'monitor'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📡 광고 모니터
        </Link>
        <Link
          href="/keyword-tool"
          className={`flex-1 py-2.5 text-xs text-center font-semibold transition-colors ${
            activeSection === 'keyword-tool'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📊 검색량 조회
        </Link>
      </div>

      {/* ── 캠페인 키워드 헤더 (광고 모니터 탭에서만 표시) ── */}
      {activeSection === 'monitor' && (
        <>
          <div className="px-4 py-3 border-b border-gray-100 shrink-0">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">캠페인 키워드</h2>
            <form onSubmit={handleAdd} className="space-y-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="새 키워드 입력"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <select
                  value={newInterval}
                  onChange={(e) => setNewInterval(Number(e.target.value) as MonitorKeyword['interval_hours'])}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[
                    { value: 1, label: '1시간' }, { value: 3, label: '3시간' },
                    { value: 6, label: '6시간' }, { value: 12, label: '12시간' },
                    { value: 24, label: '24시간' },
                  ].map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isAdding || !newKeyword.trim()}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {isAdding ? '...' : '+ 추가'}
                </button>
              </div>
            </form>
          </div>

          {/* Keyword list */}
          <nav className="flex-1 overflow-y-auto py-2">
            {keywords.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6 px-4">
                위에서 키워드를 추가하세요
              </p>
            ) : (
              keywords.map((kw) => {
                const isActive = kw.keyword === activeKeyword;
                const due = isDue(kw);
                const isExpanded = expandedId === kw.id;

                return (
                  <div key={kw.id}>
                    <button
                      onClick={() => {
                        onSelectKeyword(kw.keyword);
                        setExpandedId(isExpanded ? null : kw.id);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors group ${
                        isActive
                          ? 'bg-blue-50 border-r-2 border-r-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        !kw.enabled ? 'bg-gray-300' :
                        due ? 'bg-orange-400' :
                        'bg-green-400'
                      }`} />
                      <span className={`flex-1 text-sm font-medium truncate ${
                        isActive ? 'text-blue-700' :
                        kw.enabled ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {kw.keyword}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="mx-3 mb-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">상태</span>
                          <button
                            onClick={(e) => handleToggle(e, kw)}
                            className={`px-2 py-0.5 rounded-full font-medium text-xs ${
                              kw.enabled
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            }`}
                          >
                            {kw.enabled ? '● 활성' : '○ 비활성'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">주기</span>
                          <select
                            value={kw.interval_hours}
                            onChange={(e) => handleIntervalChange(kw, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                          >
                            {INTERVAL_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">다음 수집</span>
                          <span className={`font-medium ${due ? 'text-orange-500' : 'text-gray-600'}`}>
                            {nextRunLabel(kw)}
                          </span>
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <button
                            onClick={(e) => handleManualRun(e, kw)}
                            disabled={scrapingId === kw.id}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-1 rounded disabled:opacity-40 flex items-center justify-center gap-1"
                          >
                            {scrapingId === kw.id ? (
                              <>
                                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                수집 중
                              </>
                            ) : '▶ 지금 수집'}
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, kw)}
                            className="px-2 py-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>
        </>
      )}

      {/* 검색량 조회 탭일 때는 안내 문구만 표시 */}
      {activeSection === 'keyword-tool' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            키워드를 입력하면<br />
            네이버·구글 월간 검색량을<br />
            바로 확인할 수 있습니다
          </p>
        </div>
      )}
    </aside>
  );
}
