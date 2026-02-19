'use client'

import { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function InquiryFormPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const advertiserId = params.advertiserId as string
  const ref = searchParams.get('ref') || ''

  const [form, setForm] = useState({
    name: '',
    phone: '',
    inquiry: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      setError('이름과 연락처를 입력해주세요')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiser_id: advertiserId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          inquiry: form.inquiry.trim() || null,
          referral_code: ref || null,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || '문의 접수에 실패했습니다')
      }
    } catch {
      setError('서버 오류가 발생했습니다')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2">문의가 접수되었습니다</h2>
            <p className="text-slate-500">빠른 시일 내에 연락드리겠습니다.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>문의하기</CardTitle>
          <p className="text-sm text-slate-500">아래 정보를 입력하시면 담당자가 연락드리겠습니다.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="홍길동"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">연락처 *</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="010-1234-5678"
                required
              />
            </div>
            <div>
              <Label htmlFor="inquiry">문의 내용</Label>
              <Textarea
                id="inquiry"
                value={form.inquiry}
                onChange={e => setForm(f => ({ ...f, inquiry: e.target.value }))}
                placeholder="궁금한 점을 남겨주세요..."
                rows={4}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? '접수 중...' : '문의 접수'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
