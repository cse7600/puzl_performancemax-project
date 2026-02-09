'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Referral {
  id: string
  name: string
  phone: string | null
  referral_code_input: string | null
  partner_id: string | null
  partner_name?: string
  sales_rep: string | null
  contract_status: string
  is_valid: boolean | null
  contracted_at: string | null
  inquiry: string | null
  created_at: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-yellow-100 text-yellow-800' },
  call_1: { label: '1차 통화', color: 'bg-blue-100 text-blue-800' },
  call_2: { label: '2차 통화', color: 'bg-blue-100 text-blue-800' },
  call_3: { label: '3차 통화', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '계약완료', color: 'bg-green-100 text-green-800' },
  invalid: { label: '무효', color: 'bg-red-100 text-red-800' },
  duplicate: { label: '중복', color: 'bg-gray-100 text-gray-800' },
}

const validLabels: Record<string, { label: string; color: string }> = {
  true: { label: '유효', color: 'bg-green-100 text-green-800' },
  false: { label: '무효', color: 'bg-red-100 text-red-800' },
  null: { label: '미정', color: 'bg-gray-100 text-gray-800' },
}

export default function AdvertiserReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [validFilter, setValidFilter] = useState<string>('all')

  useEffect(() => {
    fetchReferrals()
  }, [])

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/advertiser/referrals')
      if (response.ok) {
        const data = await response.json()
        setReferrals(data.referrals || [])
      }
    } catch (error) {
      console.error('Referrals fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (referralId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/advertiser/referrals/${referralId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_status: newStatus }),
      })

      if (response.ok) {
        setReferrals(prev =>
          prev.map(r => r.id === referralId ? { ...r, contract_status: newStatus } : r)
        )
      }
    } catch (error) {
      console.error('Status change error:', error)
    }
  }

  const handleValidChange = async (referralId: string, isValid: boolean | null) => {
    try {
      const response = await fetch(`/api/advertiser/referrals/${referralId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_valid: isValid }),
      })

      if (response.ok) {
        setReferrals(prev =>
          prev.map(r => r.id === referralId ? { ...r, is_valid: isValid } : r)
        )
      }
    } catch (error) {
      console.error('Valid change error:', error)
    }
  }

  const maskPhone = (phone: string | null) => {
    if (!phone) return '-'
    if (phone.length >= 4) {
      return phone.slice(0, -4) + '****'
    }
    return '****'
  }

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.referral_code_input?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === 'all' || r.contract_status === statusFilter
    const matchesValid = validFilter === 'all' ||
      (validFilter === 'valid' && r.is_valid === true) ||
      (validFilter === 'invalid' && r.is_valid === false) ||
      (validFilter === 'pending' && r.is_valid === null)
    return matchesSearch && matchesStatus && matchesValid
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <Card className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">고객 관리</h1>
          <p className="text-slate-500 mt-1">유입된 고객 DB 관리</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">총 {referrals.length}건</p>
          <p className="text-sm text-green-600">
            유효 {referrals.filter(r => r.is_valid === true).length}건
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="이름 또는 추천코드로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="계약 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="pending">대기</SelectItem>
            <SelectItem value="call_1">1차 통화</SelectItem>
            <SelectItem value="call_2">2차 통화</SelectItem>
            <SelectItem value="call_3">3차 통화</SelectItem>
            <SelectItem value="completed">계약완료</SelectItem>
            <SelectItem value="invalid">무효</SelectItem>
            <SelectItem value="duplicate">중복</SelectItem>
          </SelectContent>
        </Select>
        <Select value={validFilter} onValueChange={setValidFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="유효 여부" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="valid">유효</SelectItem>
            <SelectItem value="invalid">무효</SelectItem>
            <SelectItem value="pending">미정</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Referrals Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>유입일</TableHead>
              <TableHead>고객명</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>추천 파트너</TableHead>
              <TableHead>계약 상태</TableHead>
              <TableHead>유효 여부</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReferrals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  {referrals.length === 0 ? '등록된 고객이 없습니다' : '검색 결과가 없습니다'}
                </TableCell>
              </TableRow>
            ) : (
              filteredReferrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(referral.created_at).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {referral.name.substring(0, 1)}**
                  </TableCell>
                  <TableCell className="text-sm">
                    {maskPhone(referral.phone)}
                  </TableCell>
                  <TableCell>
                    {referral.partner_name ? (
                      <span className="text-sm">{referral.partner_name}</span>
                    ) : referral.referral_code_input ? (
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {referral.referral_code_input}
                      </code>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={referral.contract_status}
                      onValueChange={(value) => handleStatusChange(referral.id, value)}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <Badge className={statusLabels[referral.contract_status]?.color || 'bg-gray-100'}>
                          {statusLabels[referral.contract_status]?.label || referral.contract_status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">대기</SelectItem>
                        <SelectItem value="call_1">1차 통화</SelectItem>
                        <SelectItem value="call_2">2차 통화</SelectItem>
                        <SelectItem value="call_3">3차 통화</SelectItem>
                        <SelectItem value="completed">계약완료</SelectItem>
                        <SelectItem value="invalid">무효</SelectItem>
                        <SelectItem value="duplicate">중복</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={referral.is_valid === true ? 'default' : 'outline'}
                        className="h-7 px-2 text-xs"
                        onClick={() => handleValidChange(referral.id, true)}
                      >
                        유효
                      </Button>
                      <Button
                        size="sm"
                        variant={referral.is_valid === false ? 'destructive' : 'outline'}
                        className="h-7 px-2 text-xs"
                        onClick={() => handleValidChange(referral.id, false)}
                      >
                        무효
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      상세
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
