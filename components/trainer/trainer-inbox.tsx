"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Mail, UserCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ThreadMessage = {
  content: string
  createdAt: string
  senderId?: { id?: string; _id?: string; name?: string; role?: string; avatar?: string }
  receiverId?: { id?: string; _id?: string; name?: string; role?: string; avatar?: string }
  senderRole?: string | null
  receiverRole?: string | null
}

type InboxMessage = {
  id?: string
  _id?: string
  content?: Array<{ senderId?: { id?: string; _id?: string; name?: string; role?: string; avatar?: string }; receiverId?: { id?: string; _id?: string; name?: string; role?: string; avatar?: string }; content: string; createdAt: string }> | string
  createdAt: string
  senderId: { id?: string; _id?: string; name: string; role?: string; avatar?: string }
  receiverId: { id?: string; _id?: string; name: string; role?: string; avatar?: string }
  messages?: Array<{ senderId?: { id?: string; _id?: string; name?: string; role?: string }; receiverId?: { id?: string; _id?: string; name?: string; role?: string }; senderRole?: string | null; receiverRole?: string | null; content: string; createdAt: string }>
}

type InboxClient = {
  id: string
  name: string
  email: string
  avatar?: string
  trainerId?: string
  gymSlug?: string | null
}

interface TrainerInboxProps {
  trainerId: string
}

export function TrainerInbox({ trainerId }: TrainerInboxProps) {
  const router = useRouter()
  const [clients, setClients] = useState<InboxClient[]>([])
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const threadMessages = (thread: InboxMessage): ThreadMessage[] => {
    if (Array.isArray(thread.content)) return thread.content
    if (Array.isArray(thread.messages)) return thread.messages
    if (typeof thread.content === 'string' && thread.content.trim()) {
      return [{ content: thread.content, createdAt: thread.createdAt, senderId: thread.senderId, receiverId: thread.receiverId, senderRole: thread.senderId.role, receiverRole: thread.receiverId.role }]
    }
    return []
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [clientsRes, messagesRes] = await Promise.all([
          fetch(`/api/users?role=client&trainerId=${trainerId}`, { credentials: 'include' }),
          fetch('/api/messages?inboxOnly=true', { credentials: 'include' }),
        ])

        const clientsData = await clientsRes.json().catch(() => null)
        const messagesData = await messagesRes.json().catch(() => null)

        if (clientsRes.ok) setClients(clientsData?.users || [])
        if (messagesRes.ok) setMessages(messagesData?.messages || [])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [trainerId])

  const visibleClients = useMemo(() => clients.filter((client) => client.name.toLowerCase().includes(search.toLowerCase()) || client.email.toLowerCase().includes(search.toLowerCase())), [clients, search])

  const activeClientMessages = useMemo(() => {
    if (!selectedClientId) return messages
    return messages.filter((message) => message.senderId?._id === selectedClientId || message.senderId?.id === selectedClientId || message.receiverId?._id === selectedClientId || message.receiverId?.id === selectedClientId)
  }, [messages, selectedClientId])

  const activeThread = activeClientMessages[0]

  const orderedMessages = useMemo(() => activeThread ? threadMessages(activeThread) : [], [activeThread])

  const handleStartOrReply = async () => {
    if (!selectedClientId || !reply.trim()) return
    setSending(true)
    try {
      const threadIdentifier = activeThread?._id || activeThread?.id || ''
      const res = await fetch('/api/messages', {
        method: threadIdentifier ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(threadIdentifier ? { threadId: threadIdentifier, content: reply } : { receiverId: selectedClientId, content: reply }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok && threadIdentifier && (res.status === 404 || data?.error === 'Hilo no encontrado')) {
        const fallbackRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ receiverId: selectedClientId, content: reply }),
        })
        const fallbackData = await fallbackRes.json().catch(() => null)
        if (!fallbackRes.ok) throw new Error(fallbackData?.error || 'No se pudo enviar')
        setMessages((current) => [fallbackData.message, ...current.filter((thread) => (thread._id || thread.id) !== (fallbackData.message?._id || fallbackData.message?.id))])
        setReply('')
        return
      }

      if (!res.ok) throw new Error(data?.error || 'No se pudo enviar')

      setMessages((current) => [data.message, ...current.filter((thread) => (thread._id || thread.id) !== (data.message?._id || data.message?.id))])
      setReply('')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Inbox de clientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {visibleClients.map((client) => {
              const unread = messages.filter((message) => ((message.senderId?._id === client.id || message.senderId?.id === client.id) || (message.receiverId?._id === client.id || message.receiverId?.id === client.id)) && message.receiverId?.role === 'trainer').length
              return (
                <button key={client.id} onClick={() => setSelectedClientId(client.id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedClientId === client.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                    {unread > 0 && <Badge>{unread}</Badge>}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2"><UserCircle2 className="h-4 w-4" /> Conversación</CardTitle>
            {selectedClientId && <Button variant="outline" size="sm" onClick={() => router.push(`#client-${selectedClientId}`)}>Ver perfil</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto rounded-lg border p-4">
            {orderedMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin mensajes para mostrar.</p>
            ) : (
              orderedMessages.map((message, index) => (
                <div key={`${activeThread?._id || activeThread?.id}-${index}`} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{message.senderId?.name || (message.senderRole === 'trainer' ? 'Entrenador' : 'Cliente')}</span>
                    <span>{new Date(message.createdAt).toLocaleString('es-ES')}</span>
                  </div>
                  <p className="mt-2 text-sm">{message.content}</p>
                </div>
              ))
            )}
          </div>

          {selectedClientId && (
            <div className="mt-4 space-y-3">
              <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Responder al cliente..." />
              <div className="flex justify-end">
                <Button onClick={handleStartOrReply} disabled={sending || !reply.trim()}>
                  {sending ? 'Enviando...' : 'Responder'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
