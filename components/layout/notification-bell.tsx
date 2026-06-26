"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
  metadata?: {
    eventId?: string
    link?: string
  }
}

const typeLabels: Record<string, string> = {
  class_new: "Invitación",
  class_booking: "Confirmado",
  assignment: "Asignación",
  broadcast: "Comunidad",
  system: "Sistema",
}

async function fetchUnreadCountFromApi(): Promise<number | null> {
  try {
    const res = await fetch("/api/notifications/unread-count", { credentials: "include" })
    if (!res.ok) return null
    const data = await res.json()
    return data.unreadCount ?? 0
  } catch {
    return null
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [respondingEventId, setRespondingEventId] = useState<string | null>(null)
  const [handledEventIds, setHandledEventIds] = useState<Set<string>>(() => new Set())
  const hasPrefetchedCount = useRef(false)

  const refreshUnreadCount = useCallback(async () => {
    const count = await fetchUnreadCountFromApi()
    if (count !== null) setUnreadCount(count)
  }, [])

  const prefetchUnreadCount = useCallback(() => {
    if (hasPrefetchedCount.current) return
    hasPrefetchedCount.current = true
    void refreshUnreadCount()
  }, [refreshUnreadCount])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications?limit=20", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
      hasPrefetchedCount.current = true
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (nextOpen) void fetchNotifications()
    },
    [fetchNotifications],
  )

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchUnreadCountFromApi().then((count) => {
        if (count !== null) setUnreadCount(count)
      })
    }, 60_000)

    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
    })
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
      ),
    )
    setUnreadCount((count) => Math.max(0, count - 1))
  }

  const markAllAsRead = async () => {
    await fetch("/api/notifications/read-all", {
      method: "POST",
      credentials: "include",
    })
    setNotifications((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })),
    )
    setUnreadCount(0)
  }

  const respondToEvent = async (notificationId: string, eventId: string, action: "accept" | "decline") => {
    setRespondingEventId(eventId)
    try {
      const res = await fetch(`/api/calendar/${eventId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setHandledEventIds((prev) => new Set(prev).add(eventId))
        await markAsRead(notificationId)
        await fetchNotifications()
        await refreshUnreadCount()
      }
    } finally {
      setRespondingEventId(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 rounded-full ring-1 ring-border/60 hover:bg-muted/70 hover:ring-primary/30"
          aria-label="Notificaciones"
          onMouseEnter={prefetchUnreadCount}
          onFocus={prefetchUnreadCount}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 overflow-hidden p-0" sideOffset={10}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notificaciones</p>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} sin leer</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={markAllAsRead}>
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todo
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No tienes notificaciones aún
          </div>
        ) : (
          <div className="max-h-[min(20rem,calc(100vh-6rem))] overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
            <div className="divide-y">
              {notifications.map((item) => {
                const eventId = item.metadata?.eventId
                const isInvite = item.type === "class_new" && Boolean(eventId) && !handledEventIds.has(eventId!)

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "px-4 py-3 transition hover:bg-muted/50",
                      !item.readAt && "bg-primary/5",
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        if (!item.readAt) void markAsRead(item.id)
                      }}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                          {typeLabels[item.type] || item.type}
                        </Badge>
                        {!item.readAt && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm font-medium leading-snug">{item.title}</p>
                      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{item.body}</p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString("es-ES", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </button>

                    {isInvite && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                        <Button
                          size="sm"
                          className="h-8"
                          disabled={respondingEventId === eventId}
                          onClick={() => void respondToEvent(item.id, eventId!, "accept")}
                        >
                          {respondingEventId === eventId ? "..." : "Confirmar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          disabled={respondingEventId === eventId}
                          onClick={() => void respondToEvent(item.id, eventId!, "decline")}
                        >
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
