'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Phone, MessageSquare, CheckCircle, Shield } from 'lucide-react'

function SecurityForm() {
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') || ''

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [inquiry, setInquiry] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // referrals 테이블에 INSERT
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        name,
        phone,
        inquiry,
        referral_code_input: refCode || null,
      })

    if (insertError) {
      setError('문의 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      console.error(insertError)
    } else {
      setSubmitted(true)
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">문의가 접수되었습니다!</h2>
          <p className="text-gray-600 mb-4">
            빠른 시일 내에 담당자가 연락드리겠습니다.
          </p>
          <p className="text-sm text-gray-500">
            궁금한 점이 있으시면 1588-5452로 문의해주세요.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-indigo-600" />
        </div>
        <CardTitle className="text-2xl">보안 상담 문의</CardTitle>
        <CardDescription>
          CCTV·보안 솔루션 전문 상담을 받아보세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">연락처 *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inquiry">문의 내용</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                id="inquiry"
                placeholder="문의하실 내용을 입력해주세요"
                value={inquiry}
                onChange={(e) => setInquiry(e.target.value)}
                className="w-full min-h-[100px] pl-10 pr-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <p className="text-xs text-gray-500">
            문의 신청 시 <a href="/privacy" className="text-indigo-600 hover:underline">개인정보처리방침</a>에
            동의하는 것으로 간주됩니다.
          </p>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? '처리 중...' : '상담 신청하기'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-500 mb-2">급하신 분은 전화로 문의해주세요</p>
          <a
            href="tel:1588-5452"
            className="text-lg font-bold text-indigo-600 hover:underline"
          >
            1588-5452
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-indigo-600 text-3xl font-bold mb-2">Referio</h1>
          <p className="text-gray-600">B2B 어필리에이트 플랫폼</p>
        </div>

        {/* 폼 */}
        <Suspense fallback={
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">로딩 중...</p>
            </CardContent>
          </Card>
        }>
          <SecurityForm />
        </Suspense>

        {/* 하단 정보 */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© 2026 Referio. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
