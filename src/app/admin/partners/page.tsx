'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Award,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Flame,
  AlertTriangle,
  Star,
  Users,
  Target,
  Trophy,
  Megaphone,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Partner } from '@/types/database'

interface PartnerWithStats extends Partner {
  total_referrals: number
  valid_referrals: number
  completed_contracts: number
  conversion_rate: number
  last_referral_at: string | null
  rank: number
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '반려',
}

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

// 필터 카드 정의
const FILTER_CARDS = [
  { id: 'all', label: '전체', icon: Users, color: 'bg-gray-50 border-gray-200', textColor: 'text-gray-700', activeColor: 'ring-2 ring-gray-400' },
  { id: 'active', label: '활동 중', icon: Flame, color: 'bg-green-50 border-green-200', textColor: 'text-green-600', activeColor: 'ring-2 ring-green-400', description: '2주 내 활동' },
  { id: 'dormant', label: '휴면', icon: AlertTriangle, color: 'bg-red-50 border-red-200', textColor: 'text-red-600', activeColor: 'ring-2 ring-red-400', description: '2주 이상 미활동' },
  { id: 'new', label: '신규', icon: Star, color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-600', activeColor: 'ring-2 ring-blue-400', description: '7일 내 가입' },
  { id: 'encourage', label: '독려', icon: Megaphone, color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-600', activeColor: 'ring-2 ring-purple-400', description: '전환율 낮음' },
  { id: 'top', label: 'TOP', icon: Trophy, color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-600', activeColor: 'ring-2 ring-yellow-400', description: '상위 3명' },
]

// 파트너 상태 뱃지 결정
function getPartnerStatusBadge(partner: PartnerWithStats) {
  const daysSinceLastReferral = partner.last_referral_at
    ? Math.floor((Date.now() - new Date(partner.last_referral_at).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  // Top 3 파트너
  if (partner.rank <= 3 && partner.total_referrals > 0) {
    return { icon: Trophy, label: 'TOP', color: 'text-yellow-500', bg: 'bg-yellow-50' }
  }
  // 활발한 파트너 (7일 내 활동 + 높은 전환율)
  if (daysSinceLastReferral <= 7 && partner.conversion_rate >= 30) {
    return { icon: Flame, label: 'HOT', color: 'text-orange-500', bg: 'bg-orange-50' }
  }
  // 휴면 파트너 (14일 이상 활동 없음)
  if (daysSinceLastReferral >= 14 && partner.total_referrals > 0) {
    return { icon: AlertTriangle, label: '휴면', color: 'text-red-500', bg: 'bg-red-50' }
  }
  // 신규 파트너 (가입 7일 이내 + DB 없음)
  const daysSinceJoin = Math.floor((Date.now() - new Date(partner.created_at).getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceJoin <= 7 && partner.total_referrals === 0) {
    return { icon: Star, label: '신규', color: 'text-blue-500', bg: 'bg-blue-50' }
  }
  // 독려 필요 (활동 있지만 전환율 낮음)
  if (partner.total_referrals >= 5 && partner.conversion_rate < 10) {
    return { icon: Target, label: '독려', color: 'text-purple-500', bg: 'bg-purple-50' }
  }
  return null
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('rank')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchPartners = async () => {
    const supabase = createClient()

    // 파트너 기본 정보
    let query = supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: partnersData } = await query

    if (!partnersData) {
      setPartners([])
      setLoading(false)
      return
    }

    // 각 파트너별 통계 계산
    const partnersWithStats: PartnerWithStats[] = await Promise.all(
      partnersData.map(async (partner) => {
        // 해당 파트너의 referrals 조회
        const { data: referrals } = await supabase
          .from('referrals')
          .select('id, is_valid, contract_status, created_at')
          .eq('partner_id', partner.id)

        const total_referrals = referrals?.length || 0
        const valid_referrals = referrals?.filter(r => r.is_valid === true).length || 0
        const completed_contracts = referrals?.filter(r => r.contract_status === 'completed').length || 0
        const conversion_rate = total_referrals > 0
          ? Math.round((completed_contracts / total_referrals) * 100)
          : 0

        // 마지막 referral 날짜
        const sortedReferrals = referrals?.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const last_referral_at = sortedReferrals?.[0]?.created_at || null

        return {
          ...partner,
          total_referrals,
          valid_referrals,
          completed_contracts,
          conversion_rate,
          last_referral_at,
          rank: 0, // 나중에 계산
        }
      })
    )

    // 랭킹 계산 (계약 완료 수 기준)
    const sorted = [...partnersWithStats].sort((a, b) => b.completed_contracts - a.completed_contracts)
    sorted.forEach((p, i) => {
      p.rank = i + 1
    })

    // 정렬 적용
    let finalSorted = partnersWithStats
    if (sortBy === 'rank') {
      finalSorted = [...partnersWithStats].sort((a, b) => a.rank - b.rank)
    } else if (sortBy === 'referrals') {
      finalSorted = [...partnersWithStats].sort((a, b) => b.total_referrals - a.total_referrals)
    } else if (sortBy === 'conversion') {
      finalSorted = [...partnersWithStats].sort((a, b) => b.conversion_rate - a.conversion_rate)
    } else if (sortBy === 'recent') {
      finalSorted = [...partnersWithStats].sort((a, b) => {
        if (!a.last_referral_at) return 1
        if (!b.last_referral_at) return -1
        return new Date(b.last_referral_at).getTime() - new Date(a.last_referral_at).getTime()
      })
    }

    setPartners(finalSorted)
    setLoading(false)
  }

  useEffect(() => {
    fetchPartners()
  }, [statusFilter, sortBy])

  const handleStatusChange = async (partnerId: string, newStatus: 'approved' | 'rejected') => {
    const supabase = createClient()
    const { error } = await supabase
      .from('partners')
      .update({ status: newStatus })
      .eq('id', partnerId)

    if (error) {
      toast.error('상태 변경에 실패했습니다')
      return
    }

    toast.success(newStatus === 'approved' ? '파트너가 승인되었습니다' : '파트너가 반려되었습니다')
    fetchPartners()
  }

  const handleTierChange = async (partnerId: string, newTier: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('partners')
      .update({ tier: newTier })
      .eq('id', partnerId)

    if (error) {
      toast.error('티어 변경에 실패했습니다')
      return
    }

    toast.success('티어가 변경되었습니다')
    fetchPartners()
  }

  // 필터 카운트 계산
  const getFilterCount = (filterId: string) => {
    switch (filterId) {
      case 'all':
        return partners.length
      case 'active':
        return partners.filter(p => {
          if (!p.last_referral_at) return false
          const days = Math.floor((Date.now() - new Date(p.last_referral_at).getTime()) / (1000 * 60 * 60 * 24))
          return days <= 14
        }).length
      case 'dormant':
        return partners.filter(p => {
          if (!p.last_referral_at && p.total_referrals === 0) return false
          if (!p.last_referral_at) return true
          const days = Math.floor((Date.now() - new Date(p.last_referral_at).getTime()) / (1000 * 60 * 60 * 24))
          return days > 14
        }).length
      case 'new':
        return partners.filter(p => {
          const days = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24))
          return days <= 7
        }).length
      case 'encourage':
        return partners.filter(p => p.total_referrals >= 5 && p.conversion_rate < 10).length
      case 'top':
        return partners.filter(p => p.rank <= 3 && p.total_referrals > 0).length
      default:
        return 0
    }
  }

  // 필터 적용된 파트너 목록
  const getFilteredPartners = () => {
    let filtered = partners

    // 검색 필터
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(partner =>
        partner.name?.toLowerCase().includes(search) ||
        partner.email?.toLowerCase().includes(search) ||
        partner.phone?.includes(search)
      )
    }

    // 카드 필터
    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter(p => {
          if (!p.last_referral_at) return false
          const days = Math.floor((Date.now() - new Date(p.last_referral_at).getTime()) / (1000 * 60 * 60 * 24))
          return days <= 14
        })
        break
      case 'dormant':
        filtered = filtered.filter(p => {
          if (!p.last_referral_at && p.total_referrals === 0) return false
          if (!p.last_referral_at) return true
          const days = Math.floor((Date.now() - new Date(p.last_referral_at).getTime()) / (1000 * 60 * 60 * 24))
          return days > 14
        })
        break
      case 'new':
        filtered = filtered.filter(p => {
          const days = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24))
          return days <= 7
        })
        break
      case 'encourage':
        filtered = filtered.filter(p => p.total_referrals >= 5 && p.conversion_rate < 10)
        break
      case 'top':
        filtered = filtered.filter(p => p.rank <= 3 && p.total_referrals > 0)
        break
    }

    return filtered
  }

  const filteredPartners = getFilteredPartners()

  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return '활동 없음'
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return '오늘'
    if (days === 1) return '어제'
    if (days < 7) return `${days}일 전`
    if (days < 30) return `${Math.floor(days / 7)}주 전`
    return `${Math.floor(days / 30)}개월 전`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">파트너 관리</h1>
        <p className="text-gray-500 mt-1">파트너 성과 분석 및 관리</p>
      </div>

      {/* 필터 카드 - 클릭 가능, 6개 한줄 */}
      <div className="grid grid-cols-6 gap-3">
        {FILTER_CARDS.map((filter) => {
          const IconComponent = filter.icon
          return (
            <Card
              key={filter.id}
              className={`border-2 cursor-pointer transition-all ${filter.color} ${
                activeFilter === filter.id ? filter.activeColor : ''
              } hover:shadow-md`}
              onClick={() => setActiveFilter(filter.id)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-sm font-medium ${filter.textColor}`}>{filter.label}</span>
                    {filter.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{filter.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${filter.textColor}`}>
                      {getFilterCount(filter.id)}
                    </span>
                    <div className={`w-8 h-8 rounded-full ${filter.color} flex items-center justify-center`}>
                      <IconComponent className={`w-4 h-4 ${filter.textColor}`} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="이름, 이메일, 연락처로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
                <SelectItem value="approved">승인</SelectItem>
                <SelectItem value="rejected">반려</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">랭킹순</SelectItem>
                <SelectItem value="referrals">DB 수</SelectItem>
                <SelectItem value="conversion">전환율</SelectItem>
                <SelectItem value="recent">최근 활동</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 파트너 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            파트너 목록 ({filteredPartners.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">순위</TableHead>
                  <TableHead>파트너</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-center">DB</TableHead>
                  <TableHead className="text-center">유효</TableHead>
                  <TableHead className="text-center">계약</TableHead>
                  <TableHead className="text-center">전환율</TableHead>
                  <TableHead>최근활동</TableHead>
                  <TableHead>티어</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                      파트너가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => {
                    const statusBadge = getPartnerStatusBadge(partner)
                    return (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {partner.rank <= 3 ? (
                              <span className={`font-bold ${
                                partner.rank === 1 ? 'text-yellow-500' :
                                partner.rank === 2 ? 'text-gray-400' :
                                'text-orange-400'
                              }`}>
                                {partner.rank === 1 ? '🥇' : partner.rank === 2 ? '🥈' : '🥉'}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-sm">{partner.rank}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{partner.name}</p>
                                {statusBadge && (
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${statusBadge.bg} ${statusBadge.color}`}>
                                    <statusBadge.icon className="w-3 h-3" />
                                    {statusBadge.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{partner.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[partner.status]}>
                            {STATUS_LABELS[partner.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{partner.total_referrals}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600 font-medium">{partner.valid_referrals}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-purple-600 font-medium">{partner.completed_contracts}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-medium ${
                              partner.conversion_rate >= 30 ? 'text-green-600' :
                              partner.conversion_rate >= 15 ? 'text-yellow-600' :
                              'text-gray-500'
                            }`}>
                              {partner.conversion_rate}%
                            </span>
                            {partner.conversion_rate >= 30 && (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            )}
                            {partner.conversion_rate > 0 && partner.conversion_rate < 15 && (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm ${
                            !partner.last_referral_at ? 'text-gray-400' :
                            formatRelativeDate(partner.last_referral_at) === '오늘' ||
                            formatRelativeDate(partner.last_referral_at) === '어제'
                              ? 'text-green-600 font-medium'
                              : 'text-gray-500'
                          }`}>
                            {formatRelativeDate(partner.last_referral_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={TIER_COLORS[partner.tier]}>
                            {TIER_LABELS[partner.tier]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {mounted && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {partner.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(partner.id, 'approved')}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      승인
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(partner.id, 'rejected')}
                                      className="text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      반려
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                {partner.status === 'approved' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(partner.id, 'rejected')}
                                      className="text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      반려 처리
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                {partner.status === 'rejected' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(partner.id, 'approved')}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      승인 처리
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleTierChange(partner.id, 'authorized')}
                                >
                                  <Award className="w-4 h-4 mr-2" />
                                  Authorized 티어
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTierChange(partner.id, 'silver')}
                                >
                                  <Award className="w-4 h-4 mr-2" />
                                  Silver 티어
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTierChange(partner.id, 'gold')}
                                >
                                  <Award className="w-4 h-4 mr-2" />
                                  Gold 티어
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTierChange(partner.id, 'platinum')}
                                >
                                  <Award className="w-4 h-4 mr-2" />
                                  Platinum 티어
                                </DropdownMenuItem>
                                {partner.main_channel_link && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                      <a
                                        href={partner.main_channel_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        채널 링크 열기
                                      </a>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
