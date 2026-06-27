"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, MessageSquare, Send, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

type MessageEntry = {
  senderId?: { id?: string; _id?: string; name?: string }
  receiverId?: { id?: string; _id?: string; name?: string }
  senderRole?: string | null
  receiverRole?: string | null
  content: string
  createdAt: string
}

type MessageItem = {
  id?: string
  _id?: string
  content?: MessageEntry[] | string
  createdAt: string
  senderId: { id?: string; _id?: string; name: string }
  receiverId: { id?: string; _id?: string; name: string }
  messages?: MessageEntry[]
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
  const [threadId, setThreadId] = useState<string>("")

  const threadMessages = (thread: MessageItem) => {
    if (Array.isArray(thread.content)) return thread.content
    if (Array.isArray(thread.messages)) return thread.messages
    if (typeof thread.content === 'string' && thread.content.trim()) {
      return [{ content: thread.content, createdAt: thread.createdAt, senderId: thread.senderId, receiverId: thread.receiverId }]
    }
    return []
  }

  const peerLabel = trainerId ? 'Entrenador' : 'Cliente'

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/messages?otherUserId=${trainerId || userId}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
          const peerId = trainerId || userId
          const thread = (data.messages || []).find((item: MessageItem) => {
            const sender = item.senderId?._id || item.senderId?.id
            const receiver = item.receiverId?._id || item.receiverId?.id
            return sender === peerId || receiver === peerId
          })
          setThreadId(thread?._id || thread?.id || '')
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
      const tryPut = async () => fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ threadId, content }),
      })

      const res = threadId ? await tryPut() : await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiverId: trainerId, content }),
      })

      let data = await res.json().catch(() => null)

      if (!res.ok && threadId && (res.status === 404 || data?.error === 'Hilo no encontrado')) {
        const fallbackRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ receiverId: trainerId, content }),
        })
        data = await fallbackRes.json().catch(() => null)
        if (!fallbackRes.ok) throw new Error(data?.error || 'No se pudo enviar el mensaje')
      } else if (!res.ok) {
        throw new Error(data?.error || 'No se pudo enviar el mensaje')
      }

      setMessages((current) => [data.message, ...current.filter((item) => item._id !== data.message?._id)])
      setThreadId(data.message?._id || data.message?.id || threadId)
      setContent("")
    } finally {
      setSending(false)
    }
  }
  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Button>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver al Dashboard
      </Button>

      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-primary/10" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-1">
            <Badge variant="outline" className="gap-1.5 text-xs">
              <MessageSquare className="h-3 w-3" />
              Mensajería
            </Badge>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Conversación con tu {peerLabel.toLowerCase()}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">Intercambia mensajes en un espacio limpio, rápido y enfocado en tu seguimiento.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="h-3 w-3" />
              Hilo activo
            </Badge>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-base font-semibold">Chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="max-h-[62vh] space-y-4 overflow-y-auto rounded-2xl border bg-background p-4 sm:p-5">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.flatMap((thread) => threadMessages(thread).map((message, index) => {
              const isMine = String(message.senderId?._id || message.senderId?.id) === String(userId)
              const authorLabel = message.senderRole === 'trainer' ? 'Entrenador' : 'Cliente'
              return (
                <div key={`${thread.id || thread._id}-${index}`} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm sm:max-w-[70%] ${isMine ? 'border-primary/20 bg-primary text-primary-foreground' : 'border-border bg-card'}`}>
                    <div className={`text-[11px] font-medium uppercase tracking-wide ${isMine ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {isMine ? `Tú · ${authorLabel}` : authorLabel}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    <div className={`mt-2 text-[11px] ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(message.createdAt).toLocaleString('es-ES')}
                    </div>
                  </div>
                </div>
              )
            }))}
          </div>

          <div className="rounded-2xl border bg-card/60 p-3 shadow-sm">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escribe un mensaje..." className="min-h-[110px] resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0" />
            <div className="mt-3 flex justify-end">
              <Button onClick={sendMessage} disabled={sending || !content.trim()} className="min-w-32">
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
