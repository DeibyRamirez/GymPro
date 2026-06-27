"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ACTIVITY_CATEGORY_LABELS, type ActivityCategory } from "@/lib/activity-log/types"
import { ClipboardList, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

type ActivityItem = {
  id: string
  actor: {
    id: string | null
    name: string
    avatar: string | null
  }
  action: string
  category: ActivityCategory
  categoryLabel: string
  summary: string
  targetLabel: string | null
  createdAt: string
}

const typeColors: Record<ActivityCategory, string> = {
  routine: "bg-primary/10 text-primary",
  meal_plan: "bg-accent/10 text-accent-foreground",
  user: "bg-chart-3/10 text-chart-3",
  system: "bg-muted text-muted-foreground",
  assignment: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  sale: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  calendar: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  inventory: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
}

function formatRelativeTime(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return "Hace un momento"
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Hace ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Hace ${diffDays} d`

  return date.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
}

interface ActivityFeedProps {
  gymSlug?: string
  gymName?: string
}

function ActivityFeedTable({ gymSlug, category }: { gymSlug: string; category: string }) {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    let active = true

    async function load() {
      const params = new URLSearchParams({ gymSlug, limit: "50" })
      if (category !== "all") params.set("category", category)

      try {
        const res = await fetch(`/api/activity-log?${params.toString()}`, { credentials: "include" })
        if (!active) return

        if (!res.ok) {
          setActivities([])
          return
        }

        const data = await res.json()
        setActivities(data.activities || [])
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [gymSlug, category])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aún no hay actividad registrada para este gimnasio.
      </p>
    )
  }

  return (
    <div className="max-h-[420px] overflow-y-auto overscroll-y-contain rounded-xl border [scrollbar-gutter:stable]">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead className="w-[180px]">Usuario</TableHead>
            <TableHead>Actividad</TableHead>
            <TableHead className="w-[140px]">Tipo</TableHead>
            <TableHead className="w-[150px]">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={activity.actor.avatar || "/placeholder.svg"}
                      alt={activity.actor.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                      {initials(activity.actor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium leading-tight">{activity.actor.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm text-muted-foreground">{activity.summary}</p>
                {activity.targetLabel && (
                  <p className="mt-0.5 text-xs text-muted-foreground/80">
                    Ref: {activity.targetLabel}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("text-[10px] uppercase tracking-wide", typeColors[activity.category])}
                >
                  {activity.categoryLabel}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(activity.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function ActivityFeed({ gymSlug, gymName }: ActivityFeedProps) {
  const [category, setCategory] = useState<string>("all")

  return (
    <Card className="rounded-3xl border bg-card/80 shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Bitácora del sistema
          </CardTitle>
          <CardDescription>
            {gymName
              ? `Actividad reciente de ${gymName}.`
              : "Seguimiento de actividad de tu gimnasio: usuarios, rutinas, planes, ventas y más."}
          </CardDescription>
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {(Object.entries(ACTIVITY_CATEGORY_LABELS) as [ActivityCategory, string][]).map(
              ([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!gymSlug ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Tu cuenta no tiene un gimnasio asociado para mostrar actividad.
          </p>
        ) : (
          <ActivityFeedTable key={`${gymSlug}-${category}`} gymSlug={gymSlug} category={category} />
        )}
      </CardContent>
    </Card>
  )
}

