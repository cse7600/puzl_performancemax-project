'use client'

import { useState } from 'react'

export default function EarningsSimulator() {
  const [referrals, setReferrals] = useState(50)

  const conversionRate = 0.3
  const avgPlanPrice = 149000
  const commissionRate = 0.2

  const monthlyEarnings = Math.round(referrals * conversionRate * avgPlanPrice * commissionRate)
  const yearlyEarnings = monthlyEarnings * 12

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <label className="text-white/80 text-sm font-medium">
            월 추천 수
          </label>
          <span className="text-white font-bold text-2xl">{referrals}명</span>
        </div>
        <input
          type="range"
          min={1}
          max={1000}
          value={referrals}
          onChange={(e) => setReferrals(Number(e.target.value))}
          className="referio-range w-full"
        />
        <div className="flex justify-between text-xs text-white/50 mt-1">
          <span>1명</span>
          <span>1,000명</span>
        </div>
      </div>

      <div className="text-xs text-white/50 mb-4 text-center">
        추천 {referrals}명 x 전환율 30% x 평균 플랜 &#8361;149,000 x 커미션 20%
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-xl p-6 text-center">
          <p className="text-white/60 text-sm mb-2">예상 월 수입</p>
          <p className="text-white font-bold text-3xl">
            &#8361;{monthlyEarnings.toLocaleString()}
          </p>
        </div>
        <div className="bg-white/10 rounded-xl p-6 text-center">
          <p className="text-white/60 text-sm mb-2">예상 연 수입</p>
          <p className="text-white font-bold text-3xl">
            &#8361;{yearlyEarnings.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
