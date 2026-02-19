'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Message {
  id: string
  title: string
  body: string
  target_type: string
  sent_at: string
  read_count: number
}

export default function AdvertiserMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/advertiser/messages')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('제목과 본문을 입력해주세요')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/advertiser/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, target_type: 'all' }),
      })

      if (res.ok) {
        toast.success('메시지가 발송되었습니다')
        setTitle('')
        setBody('')
        fetchMessages()
      } else {
        const data = await res.json()
        toast.error(data.error || '발송에 실패했습니다')
      }
    } catch {
      toast.error('서버 오류가 발생했습니다')
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">파트너 메시지</h1>
        <p className="text-slate-500 mt-1">파트너에게 공지사항이나 소식을 전달하세요</p>
      </div>

      {/* 메시지 작성 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">새 메시지 작성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">제목</label>
            <Input
              placeholder="메시지 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">본문</label>
            <textarea
              placeholder="파트너에게 전달할 내용을 작성하세요"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">전체 파트너에게 발송됩니다</p>
            <Button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {sending ? '발송 중...' : '메시지 발송'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 발송 히스토리 */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">발송 히스토리</h2>
        {loading ? (
          <div className="text-center py-8 text-slate-500">로딩 중...</div>
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">아직 발송한 메시지가 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <Card key={msg.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{msg.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{msg.body}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(msg.sent_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      읽음 {msg.read_count}명
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
