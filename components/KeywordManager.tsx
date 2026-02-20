'use client';

import { useState } from 'react';
import { MonitorKeyword } from '@/lib/types';

const INTERVAL_OPTIONS: { value: MonitorKeyword['interval_hours']; label: string }[] = [
  { value: 1, label: '1시간' },
  { value: 3, label: '3시간' },
  { value: 6, label: '6시간' },
  { value: 12, label: '12시간' },
  { value: 24, label: '24시간' },
];

function nextRunLabel(kw: MonitorKeyword): string {
  if (!kw.enabled) return '비활성';
  if (!kw.last_run_at) return '대기 중 (미수집)';
  const next = new Date(kw.last_run_at).getTime() + kw.interval_hours * 3600 * 1000;
  const diff = next - Date.now();
  if (diff <= 0) return '곧 수집';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}시간 ${m}분 후` : `${m}분 후`;
}

interface Props {
  keywords: MonitorKeyword[];
  onRefresh: () => void;
  onSelectKeyword: (keyword: string) => void;
}

export default function KeywordManager({ keywords, onRefresh, onSelectKeyword }: Props) {
  const [newKeyword, setNewKeyword] = useState('');
  const [newInterval, setNewInterval] = useState<MonitorKeyword['interval_hours']>(6);
  const [isAdding, setIsAdding] = useState(false);
  const [scrapingId, setScrapingId] = useState<string | null>(null);

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

  const handleToggle = async (kw: MonitorKeyword) => {
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

  const handleDelete = async (kw: MonitorKeyword) => {
    if (!confirm(`"${kw.keyword}" 키워드를 삭제할까요?`)) return;
    await fetch(`/api/keywords/${kw.id}`, { method: 'DELETE' });
    onRefresh();
  };

  const handleManualRun = async (kw: MonitorKeyword) => {
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
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">📋 모니터링 키워드 관리</h2>

      {/* Add keyword form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="새 키워드 입력"
          className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={newInterval}
          onChange={(e) => setNewInterval(Number(e.target.value) as MonitorKeyword['interval_hours'])}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {INTERVAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isAdding || !newKeyword.trim()}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isAdding ? '추가 중...' : '+ 추가'}
        </button>
      </form>

      {/* Keyword list */}
      {keywords.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">등록된 키워드가 없습니다</p>
      ) : (
        <div className="space-y-2">
          {keywords.map((kw) => (
            <div
              key={kw.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-l-4 bg-white border border-gray-200 shadow-sm text-sm ${
                kw.enabled ? 'border-l-blue-500' : 'border-l-gray-300'
              }`}
            >
              {/* Enable toggle */}
              <button
                onClick={() => handleToggle(kw)}
                className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                  kw.enabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                title={kw.enabled ? '비활성화' : '활성화'}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    kw.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>

              {/* Keyword name - clickable */}
              <button
                onClick={() => onSelectKeyword(kw.keyword)}
                className={`font-semibold text-left flex-1 min-w-0 truncate hover:text-blue-600 ${
                  kw.enabled ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {kw.keyword}
              </button>

              {/* Interval selector */}
              <select
                value={kw.interval_hours}
                onChange={(e) => handleIntervalChange(kw, e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-xs font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                {INTERVAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Next run */}
              <span className={`text-xs font-medium hidden sm:block w-28 text-right shrink-0 ${
                !kw.enabled
                  ? 'text-gray-400'
                  : kw.last_run_at && (Date.now() - new Date(kw.last_run_at).getTime()) / 3600000 < kw.interval_hours
                    ? 'text-gray-600'
                    : 'text-orange-500'
              }`}>
                {nextRunLabel(kw)}
              </span>

              {/* Manual run */}
              <button
                onClick={() => handleManualRun(kw)}
                disabled={scrapingId === kw.id}
                className="text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0"
                title="지금 수집"
              >
                {scrapingId === kw.id ? (
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : '▶'}
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(kw)}
                className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors font-bold shrink-0"
                title="삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
