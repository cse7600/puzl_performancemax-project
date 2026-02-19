'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  title: string
  body: string
  sent_at: string
  is_read: boolean
  advertisers: {
    company_name: string
    program_name: string | null
  }
}

export default function PartnerMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/partner/messages')
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
      setLoading(false)
    }
    fetchMessages()
  }, [])

  const handleToggle = async (msg: Message) => {
    if (expandedId === msg.id) {
      setExpandedId(null)
      return
    }

    setExpandedId(msg.id)

    // 읽음 처리
    if (!msg.is_read) {
      try {
        await fetch('/api/partner/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message_id: msg.id }),
        })
        setMessages(prev =>
          prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m)
        )
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }
  }

  const unreadCount = messages.filter(m => !m.is_read).length

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">메시지</h1>
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">메시지</h1>
        {unreadCount > 0 && (
          <Badge className="bg-red-500 text-white">{unreadCount}개 안읽음</Badge>
        )}
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">아직 받은 메시지가 없습니다</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const advData = msg.advertisers as unknown as { company_name: string; program_name: string | null }
            const isExpanded = expandedId === msg.id

            return (
              <Card
                key={msg.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  !msg.is_read ? 'border-l-4 border-l-indigo-500' : ''
                }`}
                onClick={() => handleToggle(msg)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">
                          {advData.program_name || advData.company_name}
                        </span>
                        {!msg.is_read && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                        )}
                      </div>
                      <h3 className={`font-semibold truncate ${!msg.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                        {msg.title}
                      </h3>
                      {!isExpanded && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{msg.body}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(msg.sent_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {msg.body}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
