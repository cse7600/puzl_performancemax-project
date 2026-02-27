'use client';

import { useState, useCallback } from 'react';
import { MonitorKeyword } from '@/lib/types';
import KeywordSidebar from '@/components/KeywordManager';

export default function CreativeJudgePage() {
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
          <h1 className="text-base font-bold text-gray-900">📊 광고 소재 자동 판정</h1>
          <div className="flex-1" />
          <p className="hidden md:block text-xs text-gray-400">
            Meta · Google · Kakao · 네이버 광고 성과 분석 엔진
          </p>
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
              activeSection="creative-judge"
            />
          </div>
        )}

        {/* Main — iframe */}
        <main className="flex-1 overflow-hidden min-w-0">
          <iframe
            src="/creative-judge.html"
            className="w-full h-full border-0"
            title="광고 소재 자동 판정 시스템"
          />
        </main>
      </div>
    </div>
  );
}
