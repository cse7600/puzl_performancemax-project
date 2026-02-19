'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Users, Crown } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  display_name: string
  max_partners: number
  max_programs: number
  monthly_price: number
  features: Record<string, boolean>
  sort_order: number
}

const FEATURE_LABELS: Record<string, string> = {
  dashboard: '대시보드',
  basic_report: '기본 리포트',
  detailed_report: '상세 리포트',
  custom_landing: '커스텀 랜딩페이지',
  auto_payouts: '자동 정산',
  white_label: '화이트라벨',
  api_access: 'API 액세스',
  crm_integration: 'CRM 연동',
  branded_content: '브랜디드 콘텐츠',
  dedicated_manager: '전담 매니저',
}

export default function PlanPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [creditBalance, setCreditBalance] = useState(0)
  const [partnerCount, setPartnerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState(false)
  const [isYearly, setIsYearly] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/advertiser/plan')
        if (res.ok) {
          const data = await res.json()
          setPlans(data.plans)
          setCurrentPlanId(data.currentPlanId)
          setTrialEndsAt(data.trialEndsAt)
          setCreditBalance(data.creditBalance)
          setPartnerCount(data.partnerCount)
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleChangePlan = async (planId: string) => {
    setChanging(true)
    try {
      const res = await fetch('/api/advertiser/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          billing_period: isYearly ? 'yearly' : 'monthly',
        }),
      })

      if (res.ok) {
        toast.success('플랜이 변경되었습니다')
        setCurrentPlanId(planId)
        const refreshRes = await fetch('/api/advertiser/plan')
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          setCreditBalance(data.creditBalance)
        }
      } else {
        const data = await res.json()
        toast.error(data.error || '플랜 변경에 실패했습니다')
      }
    } catch {
      toast.error('서버 오류가 발생했습니다')
    }
    setChanging(false)
  }

  const currentPlan = plans.find(p => p.id === currentPlanId)
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold text-slate-900">요금제</h1></div>
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">요금제</h1>
        <p className="text-slate-500 mt-1">비즈니스 규모에 맞는 플랜을 선택하세요</p>
      </div>

      {/* 현재 상태 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-lg">{currentPlan?.display_name || 'Free'}</span>
                {currentPlan?.name === 'free' && (
                  <Badge variant="secondary" className="text-xs">
                    Free 플랜
                  </Badge>
                )}
                {trialEndsAt && trialDaysLeft > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    체험 {trialDaysLeft}일 남음
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                파트너 {partnerCount}명 / {currentPlan?.max_partners || 5}명
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">보유 크레딧</p>
              <p className="text-xl font-bold">&#8361;{creditBalance.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 월간/연간 토글 */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsYearly(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !isYearly ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          월간 결제
        </button>
        <button
          onClick={() => setIsYearly(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            isYearly ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          연간 결제
          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">20% 할인</span>
        </button>
      </div>

      {/* 플랜 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.filter(p => p.name !== 'enterprise').map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const isPopular = plan.name === 'growth'
          const displayPrice = isYearly
            ? Math.round(plan.monthly_price * 0.8)
            : plan.monthly_price

          return (
            <Card
              key={plan.id}
              className={`relative ${isCurrent ? 'ring-2 ring-blue-500' : ''} ${isPopular ? 'ring-2 ring-amber-400' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-400 text-amber-950">인기</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{plan.display_name}</CardTitle>
                <div className="mt-2">
                  {displayPrice > 0 ? (
                    <div>
                      <span className="text-3xl font-bold">&#8361;{displayPrice.toLocaleString()}</span>
                      <span className="text-slate-500 text-sm">/월</span>
                      {isYearly && (
                        <p className="text-sm text-green-600 font-medium mt-1">
                          연 &#8361;{((plan.monthly_price - displayPrice) * 12).toLocaleString()} 절약
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-3xl font-bold">무료</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4 text-slate-500" />
                  파트너 최대 {plan.max_partners >= 999999 ? '무제한' : `${plan.max_partners.toLocaleString()}명`}
                </div>
                {plan.max_programs > 0 && (
                  <div className="text-sm text-slate-500">
                    프로그램 {plan.max_programs >= 999999 ? '무제한' : `${plan.max_programs}개`}
                  </div>
                )}

                <div className="space-y-2">
                  {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                    const included = plan.features?.[key]
                    return (
                      <div key={key} className={`flex items-center gap-2 text-sm ${included ? '' : 'text-slate-300'}`}>
                        {included
                          ? <Check className="w-4 h-4 text-green-500" />
                          : <X className="w-4 h-4 text-slate-300" />
                        }
                        {label}
                      </div>
                    )
                  })}
                </div>

                <div className="pt-2">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      현재 플랜
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${isPopular ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                      onClick={() => handleChangePlan(plan.id)}
                      disabled={changing}
                    >
                      {displayPrice > 0
                        ? `₩${displayPrice.toLocaleString()}으로 변경`
                        : '무료로 시작'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* 엔터프라이즈 */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white">엔터프라이즈</CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold">맞춤형</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4 text-slate-300" />
              파트너 수 무제한
            </div>
            <div className="text-sm text-slate-400">프로그램 무제한</div>

            <div className="space-y-2">
              {Object.values(FEATURE_LABELS).map((label) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  {label}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => toast.info('영업팀 문의: sales@referio.kr')}
              >
                영업팀 문의
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
