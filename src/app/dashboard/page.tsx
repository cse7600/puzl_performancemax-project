'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Copy,
  Check,
  CheckCircle,
  Circle,
  Users,
  FileCheck,
  Wallet,
  Award,
  ExternalLink,
} from 'lucide-react'
import type { Partner, PartnerStats } from '@/types/database'

const TIER_COLORS: Record<string, string> = {
  authorized: 'bg-gray-100 text-gray-700',
  silver: 'bg-gray-200 text-gray-800',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-purple-100 text-purple-800',
}

const TIER_LABELS: Record<string, string> = {
  authorized: 'Authorized',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
}

interface MilestoneItem {
  id: string
  label: string
  completed: boolean
}

const GUIDES = [
  { title: '블로거를 위한 가이드', href: '#' },
  { title: '인스타그래머를 위한 가이드', href: '#' },
  { title: '유튜버를 위한 가이드', href: '#' },
  { title: '지인 영업을 위한 가이드', href: '#' },
  { title: '카톡방/카페 영업을 위한 가이드', href: '#' },
]

export default function DashboardPage() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // 파트너 정보 가져오기
        const { data: partnerData } = await supabase
          .from('partners')
          .select('*')
          .eq('auth_user_id', user.id)
          .single()

        if (partnerData) {
          setPartner(partnerData)

          // 파트너 통계 가져오기 (View 사용)
          const { data: statsData } = await supabase
            .from('partner_stats')
            .select('*')
            .eq('partner_id', partnerData.id)
            .single()

          if (statsData) {
            setStats(statsData)
          } else {
            // View가 없거나 데이터가 없으면 기본값
            setStats({
              partner_id: partnerData.id,
              total_referrals: 0,
              total_valid: 0,
              total_contracts: 0,
              total_settlement: 0,
            })
          }
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleCopy = async () => {
    if (partner?.referral_url) {
      await navigator.clipboard.writeText(partner.referral_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 마일스톤 계산
  const milestones: MilestoneItem[] = [
    { id: 'signup', label: '파트너 가입 완료', completed: true },
    { id: 'approved', label: '파트너 승인 받기', completed: partner?.status === 'approved' },
    { id: 'first_referral', label: '첫 고객 유치하기', completed: (stats?.total_referrals || 0) > 0 },
    { id: 'first_valid', label: '첫 유효 DB 달성', completed: (stats?.total_valid || 0) > 0 },
    { id: 'first_contract', label: '첫 계약 달성', completed: (stats?.total_contracts || 0) > 0 },
    { id: 'first_settlement', label: '첫 정산 받기', completed: (stats?.total_settlement || 0) > 0 },
  ]

  const completedCount = milestones.filter(m => m.completed).length
  const progressPercent = Math.round((completedCount / milestones.length) * 100)
  const isAllMilestonesCompleted = progressPercent === 100

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 환영 메시지 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {partner?.name}님, 환영합니다! 👋
          </h1>
          <p className="text-gray-500 mt-1">오늘도 함께 성장해요</p>
        </div>
        <Badge className={TIER_COLORS[partner?.tier || 'authorized']}>
          <Award className="w-3 h-3 mr-1" />
          {TIER_LABELS[partner?.tier || 'authorized']}
        </Badge>
      </div>

      {/* 승인 대기 알림 */}
      {partner?.status === 'pending' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Circle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium text-orange-800">승인 대기 중</p>
                <p className="text-sm text-orange-600">
                  관리자 승인 후 활동을 시작하실 수 있습니다
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 전체 진행률 - 100% 달성 시 숨김 */}
      {!isAllMilestonesCompleted && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">전체 진행률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-2">
              <Progress value={progressPercent} className="flex-1" />
              <span className="text-sm font-medium text-gray-600">
                {completedCount}/{milestones.length} 완료
              </span>
            </div>
            <p className="text-sm text-gray-500">{progressPercent}% 달성</p>
          </CardContent>
        </Card>
      )}

      {/* 추천 URL */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">내 추천 URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm truncate">
              {partner?.referral_url || 'https://keeper.ceo/security?ref=...'}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={!partner?.referral_url}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            이 링크를 공유하면 유입 고객이 자동으로 기록됩니다
          </p>
        </CardContent>
      </Card>

      {/* 마일스톤 - 100% 달성 시 숨김 */}
      {!isAllMilestonesCompleted && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">마일스톤</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 시작하기 */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">시작하기</h4>
                <div className="space-y-3">
                  {milestones.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                      <span className={item.completed ? 'text-gray-700' : 'text-gray-400'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 활동하기 */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">활동하기</h4>
                <div className="space-y-3">
                  {milestones.slice(2, 4).map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                      <span className={item.completed ? 'text-gray-700' : 'text-gray-400'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 성장하기 */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">성장하기</h4>
                <div className="space-y-3">
                  {milestones.slice(4, 6).map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                      <span className={item.completed ? 'text-gray-700' : 'text-gray-400'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 현재 진행 상황 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">승인 상태</p>
                <p className="font-semibold">
                  {partner?.status === 'approved' ? '승인' :
                   partner?.status === 'pending' ? '대기' : '반려'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">유치 고객</p>
                <p className="font-semibold">{stats?.total_referrals || 0}명</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">유효 DB</p>
                <p className="font-semibold">{stats?.total_valid || 0}건</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">누적 정산</p>
                <p className="font-semibold">
                  ₩{(stats?.total_settlement || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필독 콘텐츠 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">콘텐츠 작성 전 필독</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GUIDES.map((guide) => (
              <a
                key={guide.title}
                href={guide.href}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium">{guide.title}</span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
