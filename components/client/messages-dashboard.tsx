"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import { useEffect, useState } from "react"

type MessageItem = {
  id?: string
  _id?: string
  content: string
  createdAt: string
  senderId: { id?: string; _id?: string; name: string }
  receiverId: { id?: string; _id?: string; name: string }
}

interface MessagesDashboardProps {
  onBack: () => void
  userId: string
  trainerId?: string
}

export function MessagesDashboard({ onBack, userId, trainerId }: MessagesDashboardProps) {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/messages?otherUserId=${trainerId || userId}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [trainerId, userId])

  const sendMessage = async () => {
    if (!content.trim() || !trainerId) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiverId: trainerId, content }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((current) => [...current, data.message])
        setContent("")
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver al Dashboard
      </Button>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mensajes</h2>
        <p className="text-muted-foreground mt-2">Conversación interna con tu entrenador.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Chat</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-lg border p-4">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : messages.map((message) => (
              <div key={message.id || message._id} className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">{message.senderId?.name || 'Mensaje'}</div>
                <div className="mt-1 text-sm">{message.content}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escribe un mensaje..." />
            <div className="flex justify-end">
              <Button onClick={sendMessage} disabled={sending || !content.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
