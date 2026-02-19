'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight, Check, X } from 'lucide-react'

const PLANS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    partners: '3명',
    programs: '1개',
    autoPayouts: false,
    whiteLabel: false,
    apiAccess: false,
    crmIntegration: false,
    brandedContent: false,
    dedicatedManager: false,
    popular: false,
  },
  {
    name: 'Starter',
    monthlyPrice: 49000,
    yearlyPrice: 39000,
    partners: '30명',
    programs: '3개',
    autoPayouts: false,
    whiteLabel: false,
    apiAccess: false,
    crmIntegration: true,
    brandedContent: false,
    dedicatedManager: false,
    popular: false,
  },
  {
    name: 'Growth',
    monthlyPrice: 99000,
    yearlyPrice: 79000,
    partners: '200명',
    programs: '10개',
    autoPayouts: true,
    whiteLabel: false,
    apiAccess: true,
    crmIntegration: true,
    brandedContent: true,
    dedicatedManager: false,
    popular: true,
  },
  {
    name: 'Scale',
    monthlyPrice: 249000,
    yearlyPrice: 199000,
    partners: '무제한',
    programs: '무제한',
    autoPayouts: true,
    whiteLabel: true,
    apiAccess: true,
    crmIntegration: true,
    brandedContent: true,
    dedicatedManager: false,
    popular: false,
  },
]

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            심플한 요금제
          </h2>
          <p className="text-lg text-slate-500">
            작은 팀부터 엔터프라이즈까지. 파트너 수에 따라 유연하게 확장하세요.
          </p>
        </div>

        {/* 월간/연간 토글 */}
        <div className="flex items-center justify-center gap-3 mb-12">
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

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
            const yearlySaving = (plan.monthlyPrice - plan.yearlyPrice) * 12
            const isFree = plan.monthlyPrice === 0

            return (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl p-7 relative ${
                  plan.popular ? 'border-2 border-slate-900' : 'border border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1 rounded-full">
                    추천
                  </div>
                )}
                <h3 className="font-semibold text-slate-900 text-lg">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  {isFree ? (
                    <span className="text-4xl font-bold">무료</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">&#8361;{price.toLocaleString()}</span>
                      <span className="text-slate-500">/월</span>
                    </>
                  )}
                </div>
                {isYearly && !isFree ? (
                  <p className="text-sm text-green-600 font-medium mb-4">
                    연 &#8361;{yearlySaving.toLocaleString()} 절약
                  </p>
                ) : (
                  <div className="mb-4" />
                )}
                <ul className="space-y-2.5 text-sm text-slate-600 mb-8">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />파트너 {plan.partners}
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />프로그램 {plan.programs}
                  </li>
                  <li className="flex items-center gap-2">
                    {plan.crmIntegration
                      ? <Check className="w-4 h-4 text-green-500 shrink-0" />
                      : <X className="w-4 h-4 text-slate-300 shrink-0" />
                    }
                    <span className={plan.crmIntegration ? '' : 'text-slate-400'}>CRM 연동</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {plan.autoPayouts
                      ? <Check className="w-4 h-4 text-green-500 shrink-0" />
                      : <X className="w-4 h-4 text-slate-300 shrink-0" />
                    }
                    <span className={plan.autoPayouts ? '' : 'text-slate-400'}>자동 정산</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {plan.apiAccess
                      ? <Check className="w-4 h-4 text-green-500 shrink-0" />
                      : <X className="w-4 h-4 text-slate-300 shrink-0" />
                    }
                    <span className={plan.apiAccess ? '' : 'text-slate-400'}>API 액세스</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {plan.brandedContent
                      ? <Check className="w-4 h-4 text-green-500 shrink-0" />
                      : <X className="w-4 h-4 text-slate-300 shrink-0" />
                    }
                    <span className={plan.brandedContent ? '' : 'text-slate-400'}>브랜디드 콘텐츠</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {plan.whiteLabel
                      ? <Check className="w-4 h-4 text-green-500 shrink-0" />
                      : <X className="w-4 h-4 text-slate-300 shrink-0" />
                    }
                    <span className={plan.whiteLabel ? '' : 'text-slate-400'}>화이트라벨</span>
                  </li>
                </ul>
                <Link href="/advertiser/signup">
                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    className={`w-full ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                  >
                    {isFree ? '무료로 시작' : '시작하기'}
                  </Button>
                </Link>
              </div>
            )
          })}

          {/* Enterprise */}
          <div className="bg-slate-900 rounded-2xl p-7 text-white">
            <h3 className="font-semibold text-lg">Enterprise</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold">맞춤형</span>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-300 mb-8">
              <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />파트너 무제한</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />프로그램 무제한</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400 shrink-0" />CRM 연동</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400 shrink-0" />자동 정산</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400 shrink-0" />API 액세스</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400 shrink-0" />브랜디드 콘텐츠</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400 shrink-0" />화이트라벨</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400 shrink-0" />전담 매니저</li>
            </ul>
            <Link href="mailto:sales@referio.kr">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                영업팀 문의
              </Button>
            </Link>
          </div>
        </div>
        <p className="text-center text-sm text-slate-500 mt-8">
          Free 요금제로 바로 시작하세요 &middot; 신용카드 불필요
        </p>
      </div>
    </section>
  )
}
