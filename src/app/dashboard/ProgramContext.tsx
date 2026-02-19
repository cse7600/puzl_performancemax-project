'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PartnerProgram } from '@/types/database'

interface ProgramWithAdvertiser extends PartnerProgram {
  advertisers: {
    id: string
    company_name: string
    program_name: string | null
    logo_url: string | null
    primary_color: string | null
  }
}

interface ProgramContextType {
  programs: ProgramWithAdvertiser[]
  selectedProgram: ProgramWithAdvertiser | null
  selectProgram: (programId: string) => void
  loading: boolean
  refresh: () => Promise<void>
}

const ProgramContext = createContext<ProgramContextType>({
  programs: [],
  selectedProgram: null,
  selectProgram: () => {},
  loading: true,
  refresh: async () => {},
})

export function ProgramProvider({
  children,
  partnerId,
}: {
  children: React.ReactNode
  partnerId: string | null
}) {
  const [programs, setPrograms] = useState<ProgramWithAdvertiser[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPrograms = useCallback(async () => {
    if (!partnerId) return

    const supabase = createClient()
    const { data } = await supabase
      .from('partner_programs')
      .select(`
        *,
        advertisers!inner(
          id,
          company_name,
          program_name,
          logo_url,
          primary_color
        )
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })

    if (data) {
      setPrograms(data as unknown as ProgramWithAdvertiser[])
    }
    setLoading(false)
  }, [partnerId])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  // localStorage에서 선택된 프로그램 복원
  useEffect(() => {
    const saved = localStorage.getItem('selectedProgramId')
    if (saved) setSelectedProgramId(saved)
  }, [])

  // 프로그램이 로드되면, 저장된 선택이 유효한지 확인
  useEffect(() => {
    if (programs.length > 0 && selectedProgramId) {
      const valid = programs.find(p => p.id === selectedProgramId)
      if (!valid) {
        // 유효하지 않으면 첫 승인 프로그램 또는 첫 프로그램 선택
        const approved = programs.find(p => p.status === 'approved')
        const newId = approved?.id || programs[0].id
        setSelectedProgramId(newId)
        localStorage.setItem('selectedProgramId', newId)
      }
    } else if (programs.length > 0 && !selectedProgramId) {
      const approved = programs.find(p => p.status === 'approved')
      if (approved) {
        setSelectedProgramId(approved.id)
        localStorage.setItem('selectedProgramId', approved.id)
      }
    }
  }, [programs, selectedProgramId])

  const selectProgram = (programId: string) => {
    setSelectedProgramId(programId)
    localStorage.setItem('selectedProgramId', programId)
  }

  const selectedProgram = programs.find(p => p.id === selectedProgramId) || null

  return (
    <ProgramContext.Provider
      value={{ programs, selectedProgram, selectProgram, loading, refresh: fetchPrograms }}
    >
      {children}
    </ProgramContext.Provider>
  )
}

export function useProgram() {
  return useContext(ProgramContext)
}
