'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalPartners: number
  activePartners: number
  totalReferrals: number
  validReferrals: number
  totalSettlements: number
  pendingSettlements: number
  thisMonthSettlementAmount: number
}

interface RecentActivity {
  id: string
  type: 'partner' | 'referral' | 'settlement'
  description: string
  createdAt: string
}

export default function AdvertiserDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/advertiser/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-16 bg-slate-200 rounded animate-pulse" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">대시보드</h1>
        <p className="text-slate-500 mt-1">파트너 프로그램 현황을 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">전체 파트너</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {stats?.totalPartners ?? 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                활성 {stats?.activePartners ?? 0}명
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">총 유입 고객</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {stats?.totalReferrals ?? 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                유효 {stats?.validReferrals ?? 0}건
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">정산 건수</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {stats?.totalSettlements ?? 0}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                대기 {stats?.pendingSettlements ?? 0}건
              </p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">이번 달 정산</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(stats?.thisMonthSettlementAmount ?? 0)}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">최근 활동</h2>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {activity.type === 'partner' && '👤'}
                    {activity.type === 'referral' && '📋'}
                    {activity.type === 'settlement' && '💵'}
                  </div>
                  <span className="text-sm text-slate-700">{activity.description}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <div className="text-5xl mb-4">📭</div>
            <p>아직 활동 내역이 없습니다</p>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push('/advertiser/partners')}
        >
          <div className="text-3xl mb-3">👥</div>
          <h3 className="font-bold text-slate-900">파트너 관리</h3>
          <p className="text-sm text-slate-500 mt-1">파트너를 승인하고 관리하세요</p>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push('/advertiser/campaigns')}
        >
          <div className="text-3xl mb-3">📢</div>
          <h3 className="font-bold text-slate-900">캠페인 설정</h3>
          <p className="text-sm text-slate-500 mt-1">수수료와 정책을 설정하세요</p>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push('/advertiser/settlements')}
        >
          <div className="text-3xl mb-3">💰</div>
          <h3 className="font-bold text-slate-900">정산 관리</h3>
          <p className="text-sm text-slate-500 mt-1">정산 내역을 확인하세요</p>
        </Card>
      </div>
    </div>
  )
}
