'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export default function AdvertiserLoginPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/advertiser/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // 로그인 성공 - 광고주 대시보드로 이동
      router.push('/advertiser/dashboard')
      router.refresh()
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-slate-900">광고주 로그인</h1>
          <p className="text-sm text-slate-500">
            파트너 프로그램 관리 시스템에 로그인하세요
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">사용자 ID</Label>
            <Input
              id="userId"
              type="text"
              placeholder="admin"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-center text-slate-500">
            데모 계정: admin / password123
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-blue-600 hover:underline"
          >
            파트너 로그인으로 이동
          </button>
        </div>
      </Card>
    </div>
  )
}
