'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Users } from 'lucide-react'
import type { Partner, Referral } from '@/types/database'
import { useProgram } from '../ProgramContext'

export default function CustomersPage() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterField, setFilterField] = useState<'name' | 'phone'>('name')
  const { selectedProgram } = useProgram()

  useEffect(() => {
    const fetchPartner = async () => {
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
        }
      }
      setLoading(false)
    }
    fetchPartner()
  }, [])

  // 선택된 프로그램 변경 시 referrals 재조회
  useEffect(() => {
    const fetchReferrals = async () => {
      if (!partner?.id) return

      const supabase = createClient()
      let query = supabase
        .from('referrals')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })

      if (selectedProgram) {
        query = query.eq('advertiser_id', selectedProgram.advertiser_id)
      }

      const { data: referralsData } = await query

      if (referralsData) {
        setReferrals(referralsData)
      }
    }
    fetchReferrals()
  }, [partner?.id, selectedProgram])

  // 필터링된 피추천인 목록
  const filteredReferrals = referrals.filter((referral) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    if (filterField === 'name') {
      return referral.name_masked?.toLowerCase().includes(searchLower) ||
             referral.name?.toLowerCase().includes(searchLower)
    } else {
      return referral.phone?.toLowerCase().includes(searchLower)
    }
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  const programLabel = selectedProgram
    ? (selectedProgram.advertisers as unknown as { program_name: string | null; company_name: string }).program_name ||
      (selectedProgram.advertisers as unknown as { company_name: string }).company_name
    : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">고객</h1>
        <p className="text-gray-500 mt-1">
          {programLabel
            ? `${programLabel} - 추천으로 유입된 고객 목록`
            : '내 추천으로 유입된 고객 목록입니다'}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">전체 고객</p>
                <p className="text-xl font-bold">{referrals.length}명</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-gray-500">유효 고객</p>
              <p className="text-xl font-bold text-green-600">
                {referrals.filter(r => r.is_valid).length}명
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-gray-500">계약 완료</p>
              <p className="text-xl font-bold text-purple-600">
                {referrals.filter(r => r.contract_status === 'completed').length}명
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="검색어를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterField}
              onValueChange={(value: 'name' | 'phone') => setFilterField(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="검색 필드" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">피추천인 이름</SelectItem>
                <SelectItem value="phone">연락처</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReferrals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {referrals.length === 0
                ? '아직 유입된 고객이 없습니다'
                : '검색 결과가 없습니다'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>유입일시</TableHead>
                    <TableHead>고객명</TableHead>
                    <TableHead>유효여부</TableHead>
                    <TableHead>계약상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(referral.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {referral.name_masked || referral.name}
                      </TableCell>
                      <TableCell>
                        {referral.is_valid ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            유효
                          </Badge>
                        ) : (
                          <Badge variant="secondary">대기</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <ContractStatusBadge status={referral.contract_status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ContractStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: '대기', className: 'bg-gray-100 text-gray-700' },
    call_1: { label: '1차 콜', className: 'bg-blue-100 text-blue-700' },
    call_2: { label: '2차 콜', className: 'bg-blue-100 text-blue-700' },
    call_3: { label: '3차 콜', className: 'bg-blue-100 text-blue-700' },
    completed: { label: '계약완료', className: 'bg-purple-100 text-purple-700' },
    invalid: { label: '무효', className: 'bg-red-100 text-red-700' },
    duplicate: { label: '중복', className: 'bg-yellow-100 text-yellow-700' },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <Badge className={`${config.className} hover:${config.className}`}>
      {config.label}
    </Badge>
  )
}
