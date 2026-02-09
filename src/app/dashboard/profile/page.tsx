'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Phone,
  Link as LinkIcon,
  Building,
  CreditCard,
  Award,
  ExternalLink,
  Save,
  Copy,
  Check,
} from 'lucide-react'
import type { Partner } from '@/types/database'

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

const GUIDES = [
  { title: '활동 가이드 보기', href: '#' },
  { title: '다른 파트너들은 어떻게 활동할까?', href: '#' },
  { title: '이달의 프로모션 살펴보기', href: '#' },
]

export default function ProfilePage() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // 수정 가능한 필드들
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [mainChannelLink, setMainChannelLink] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: partnerData } = await supabase
          .from('partners')
          .select('*')
          .eq('auth_user_id', user.id)
          .single()

        if (partnerData) {
          setPartner(partnerData)
          setBankName(partnerData.bank_name || '')
          setBankAccount(partnerData.bank_account || '')
          setAccountHolder(partnerData.account_holder || '')
          setMainChannelLink(partnerData.main_channel_link || '')
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleSave = async () => {
    if (!partner) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('partners')
      .update({
        bank_name: bankName || null,
        bank_account: bankAccount || null,
        account_holder: accountHolder || null,
        main_channel_link: mainChannelLink || null,
      })
      .eq('id', partner.id)

    if (!error) {
      setPartner({
        ...partner,
        bank_name: bankName || null,
        bank_account: bankAccount || null,
        account_holder: accountHolder || null,
        main_channel_link: mainChannelLink || null,
      })
      setEditMode(false)
    }
    setSaving(false)
  }

  const handleCopy = async () => {
    if (partner?.referral_url) {
      await navigator.clipboard.writeText(partner.referral_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">활동정보</h1>
          <p className="text-gray-500 mt-1">프로필 및 정산 정보를 관리하세요</p>
        </div>
        <Badge className={TIER_COLORS[partner?.tier || 'authorized']}>
          <Award className="w-3 h-3 mr-1" />
          {TIER_LABELS[partner?.tier || 'authorized']}
        </Badge>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">파트너 이름</p>
                <p className="font-medium">{partner?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">이메일</p>
                <p className="font-medium">{partner?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">연락처</p>
                <p className="font-medium">{partner?.phone || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">추천인 URL</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate text-sm">
                    {partner?.referral_url}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 수수료 정보 */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">계약 수수료 단가</p>
              <p className="font-bold text-lg text-orange-600">
                ₩{(partner?.contract_commission || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">리드 수수료 단가</p>
              <p className="font-bold text-lg text-blue-600">
                ₩{(partner?.lead_commission || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">월 활동비</p>
              <p className="font-bold text-lg text-green-600">
                ₩{(partner?.monthly_fee || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 정산 정보 (수정 가능) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">정산 정보</CardTitle>
            <CardDescription>정산 받으실 계좌 정보를 입력해주세요</CardDescription>
          </div>
          {!editMode && (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              수정하기
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="bankName">은행명</Label>
                <Input
                  id="bankName"
                  placeholder="국민은행"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount">계좌번호</Label>
                <Input
                  id="bankAccount"
                  placeholder="123-456-789012"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolder">예금주</Label>
                <Input
                  id="accountHolder"
                  placeholder="홍길동"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainChannelLink">주 활동 채널 링크</Label>
                <Input
                  id="mainChannelLink"
                  placeholder="https://blog.naver.com/yourname"
                  value={mainChannelLink}
                  onChange={(e) => setMainChannelLink(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? '저장 중...' : '저장하기'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false)
                    setBankName(partner?.bank_name || '')
                    setBankAccount(partner?.bank_account || '')
                    setAccountHolder(partner?.account_holder || '')
                    setMainChannelLink(partner?.main_channel_link || '')
                  }}
                >
                  취소
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Building className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">은행명</p>
                  <p className="font-medium">{partner?.bank_name || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">계좌번호</p>
                  <p className="font-medium">{partner?.bank_account || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">예금주</p>
                  <p className="font-medium">{partner?.account_holder || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">주 활동 채널</p>
                  <p className="font-medium truncate">
                    {partner?.main_channel_link || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가 안내 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">추가 안내</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
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
