"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, MessageSquare, Send } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

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
  onMessagesRead?: () => void
  userId: string
  trainerId?: string
}

export function MessagesDashboard({ onBack, onMessagesRead, userId, trainerId }: MessagesDashboardProps) {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [threadId, setThreadId] = useState<string>("")

  const threadMessages = (thread: MessageItem) => {
    if (Array.isArray(thread.content)) return thread.content
    if (Array.isArray(thread.messages)) return thread.messages
    if (typeof thread.content === "string" && thread.content.trim()) {
      return [
        {
          content: thread.content,
          createdAt: thread.createdAt,
          senderId: thread.senderId,
          receiverId: thread.receiverId,
        },
      ]
    }
    return []
  }

  const peerLabel = trainerId ? "entrenador" : "cliente"

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/messages?otherUserId=${trainerId || userId}`, {
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
          const peerId = trainerId || userId
          const thread = (data.messages || []).find((item: MessageItem) => {
            const sender = item.senderId?._id || item.senderId?.id
            const receiver = item.receiverId?._id || item.receiverId?.id
            return sender === peerId || receiver === peerId
          })
          setThreadId(thread?._id || thread?.id || "")

          await fetch("/api/messages/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ otherUserId: trainerId || userId }),
          })
          onMessagesRead?.()
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [trainerId, userId, onMessagesRead])

  const chatMessages = useMemo(
    () =>
      messages
        .flatMap((thread) =>
          threadMessages(thread).map((message, index) => ({
            key: `${thread.id || thread._id}-${index}`,
            message,
          })),
        )
        .sort(
          (a, b) =>
            new Date(a.message.createdAt).getTime() - new Date(b.message.createdAt).getTime(),
        ),
    [messages],
  )

  const sendMessage = async () => {
    if (!content.trim() || !trainerId) return
    setSending(true)
    try {
      const tryPut = async () =>
        fetch("/api/messages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ threadId, content }),
        })

      const res = threadId
        ? await tryPut()
        : await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ receiverId: trainerId, content }),
          })

      let data = await res.json().catch(() => null)

      if (!res.ok && threadId && (res.status === 404 || data?.error === "Hilo no encontrado")) {
        const fallbackRes = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ receiverId: trainerId, content }),
        })
        data = await fallbackRes.json().catch(() => null)
        if (!fallbackRes.ok) throw new Error(data?.error || "No se pudo enviar el mensaje")
      } else if (!res.ok) {
        throw new Error(data?.error || "No se pudo enviar el mensaje")
      }

      setMessages((current) => [
        data.message,
        ...current.filter((item) => item._id !== data.message?._id),
      ])
      setThreadId(data.message?._id || data.message?.id || threadId)
      setContent("")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 px-0">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex h-64 items-center justify-center rounded-xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 gap-2 px-0">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
            <h2 className="truncate text-lg font-semibold tracking-tight">
              Chat con tu {peerLabel}
            </h2>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            Mensajes directos con tu {peerLabel}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="h-[min(420px,50vh)] space-y-2 overflow-y-auto border-b bg-muted/20 p-3">
            {chatMessages.length === 0 ? (
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <MessageSquare className="h-8 w-8 opacity-40" />
                <p>No hay mensajes todavía.</p>
                <p className="text-xs">Escribe el primero para iniciar la conversación.</p>
              </div>
            ) : (
              chatMessages.map(({ key, message }) => {
                const isMine = String(message.senderId?._id || message.senderId?.id) === String(userId)
                const authorLabel = message.senderRole === "trainer" ? "Entrenador" : "Cliente"

                return (
                  <div key={key} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] rounded-xl px-3 py-2 sm:max-w-[75%] ${
                        isMine
                          ? "bg-primary text-primary-foreground"
                          : "border bg-background"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-medium uppercase tracking-wide ${
                          isMine ? "text-primary-foreground/75" : "text-muted-foreground"
                        }`}
                      >
                        {isMine ? `Tú · ${authorLabel}` : authorLabel}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm leading-snug">
                        {message.content}
                      </p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isMine ? "text-primary-foreground/65" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex items-end gap-2 p-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={trainerId ? "Escribe un mensaje..." : "No tienes entrenador asignado"}
              disabled={!trainerId}
              rows={2}
              className="min-h-[72px] max-h-28 resize-none text-sm"
            />
            <Button
              size="icon"
              onClick={() => void sendMessage()}
              disabled={sending || !content.trim() || !trainerId}
              className="h-10 w-10 shrink-0"
              aria-label="Enviar mensaje"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
