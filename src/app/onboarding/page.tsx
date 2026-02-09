'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { User, Phone, Link as LinkIcon, CheckCircle } from 'lucide-react'

const CHANNELS = [
  { id: 'blog', label: '네이버 블로그' },
  { id: 'instagram', label: '인스타그램' },
  { id: 'youtube', label: '유튜브' },
  { id: 'community', label: '커뮤니티·단톡방' },
  { id: 'other', label: '기타' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [mainChannelLink, setMainChannelLink] = useState('')

  useEffect(() => {
    // 현재 유저 정보 가져오기
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // partners 테이블에서 이름 가져오기
        const { data: partner } = await supabase
          .from('partners')
          .select('name, phone, channels')
          .eq('auth_user_id', user.id)
          .single()

        if (partner) {
          setName(partner.name || '')
          if (partner.phone) setPhone(partner.phone)
          if (partner.channels) setSelectedChannels(partner.channels)
        }
      }
    }
    fetchUser()
  }, [])

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('로그인이 필요합니다')
      setLoading(false)
      return
    }

    // partners 테이블 업데이트
    const { error: updateError } = await supabase
      .from('partners')
      .update({
        name,
        phone,
        channels: selectedChannels,
        main_channel_link: mainChannelLink || null,
      })
      .eq('auth_user_id', user.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)

    // 3초 후 대시보드로 이동
    setTimeout(() => {
      router.push('/dashboard')
    }, 3000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">가입 신청이 완료되었습니다!</h2>
            <p className="text-gray-600 mb-4">
              관리자 승인 후 활동을 시작하실 수 있습니다.
            </p>
            <p className="text-sm text-gray-500">
              승인이 완료되면 이메일로 안내해 드릴게요.
            </p>
            <p className="text-sm text-orange-500 mt-4">
              잠시 후 대시보드로 이동합니다...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-orange-500 text-2xl font-bold mb-2">keeper mate</h1>
          <p className="text-gray-600">추가 정보를 입력해주세요</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>파트너 정보 입력</CardTitle>
            <CardDescription>
              활동에 필요한 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 이름 */}
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

              {/* 연락처 */}
              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
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

              {/* 주 활동 채널 */}
              <div className="space-y-3">
                <Label>주 활동 채널 (복수 선택 가능)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {CHANNELS.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={channel.id}
                        checked={selectedChannels.includes(channel.id)}
                        onCheckedChange={() => handleChannelToggle(channel.id)}
                      />
                      <label
                        htmlFor={channel.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {channel.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 주 활동 채널 링크 */}
              <div className="space-y-2">
                <Label htmlFor="mainChannelLink">주 활동 채널 링크</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="mainChannelLink"
                    type="url"
                    placeholder="https://blog.naver.com/yourname"
                    value={mainChannelLink}
                    onChange={(e) => setMainChannelLink(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  가장 활발하게 활동하는 채널의 링크를 입력해주세요
                </p>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={loading || selectedChannels.length === 0}
              >
                {loading ? '제출 중...' : '제출하기'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
