'use client'

import { Card } from '@/components/ui/card'

export default function AdvertiserDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">대시보드</h1>
        <p className="text-slate-500 mt-1">파트너 프로그램 현황을 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">전체 파트너</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">0</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">활성 파트너</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">0</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">총 유입 고객</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">0</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">이번 달 정산</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">₩0</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">최근 활동</h2>
        <div className="text-center py-12 text-slate-500">
          <div className="text-5xl mb-4">📭</div>
          <p>아직 활동 내역이 없습니다</p>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-3xl mb-3">➕</div>
          <h3 className="font-bold text-slate-900">새 파트너 초대</h3>
          <p className="text-sm text-slate-500 mt-1">새로운 파트너를 초대하세요</p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-3xl mb-3">📢</div>
          <h3 className="font-bold text-slate-900">캠페인 생성</h3>
          <p className="text-sm text-slate-500 mt-1">새로운 캠페인을 시작하세요</p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-3xl mb-3">📈</div>
          <h3 className="font-bold text-slate-900">성과 리포트</h3>
          <p className="text-sm text-slate-500 mt-1">상세한 성과를 확인하세요</p>
        </Card>
      </div>
    </div>
  )
}
