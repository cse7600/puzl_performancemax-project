'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, User, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // 1. Supabase Auth로 회원가입
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?signup=true&name=${encodeURIComponent(name)}`,
        data: {
          name,
        },
      },
    })

    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* 좌측 오렌지 배경 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 p-12 flex-col justify-between">
        <div>
          <h1 className="text-white text-3xl font-bold">keeper mate</h1>
        </div>
        <div className="text-white">
          <h2 className="text-4xl font-bold mb-4">
            키퍼 메이트로<br />새로운 수익을 만드세요
          </h2>
          <p className="text-orange-100 text-lg">
            블로거, 유튜버, 인플루언서 누구나 파트너가 될 수 있습니다
          </p>
        </div>
        <div className="text-orange-200 text-sm">
          © 2025 한화비전 키퍼. All rights reserved.
        </div>
      </div>

      {/* 우측 가입 폼 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="lg:hidden mb-4">
              <h1 className="text-orange-500 text-2xl font-bold">keeper mate</h1>
            </div>
            <CardTitle className="text-2xl">파트너 가입</CardTitle>
            <CardDescription>
              키퍼 메이트가 되어 함께 성장해요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">이메일을 확인해주세요</h3>
                <p className="text-gray-600 mb-4">
                  <span className="font-medium">{email}</span>로<br />
                  가입 확인 링크를 보내드렸습니다
                </p>
                <p className="text-sm text-gray-500">
                  링크를 클릭하면 추가 정보 입력 화면으로 이동합니다
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSent(false)}
                  className="mt-4"
                >
                  다른 이메일로 시도
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
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
                  <Label htmlFor="email">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                <p className="text-xs text-gray-500">
                  지원서 제출 시, <Link href="/terms" className="text-orange-500 hover:underline">이용약관</Link> 및{' '}
                  <Link href="/privacy" className="text-orange-500 hover:underline">개인정보처리방침</Link>에
                  동의하는 것으로 간주됩니다.
                </p>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={loading}
                >
                  {loading ? '처리 중...' : '가입 신청하기'}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  이미 메이트이신가요?{' '}
                  <Link href="/login" className="text-orange-500 hover:underline font-medium">
                    로그인하기
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
