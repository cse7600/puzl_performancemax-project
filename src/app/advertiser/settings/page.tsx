'use client'

import { Card } from '@/components/ui/card'

export default function AdvertiserSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">설정</h1>
        <p className="text-slate-500 mt-1">광고주 계정 및 시스템 설정</p>
      </div>

      <Card className="p-6">
        <div className="text-center py-12 text-slate-500">
          <div className="text-5xl mb-4">⚙️</div>
          <p>설정 기능 준비 중입니다</p>
        </div>
      </Card>
    </div>
  )
}
