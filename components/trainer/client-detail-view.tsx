"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, CalendarCheck2, Dumbbell, LayoutDashboard, Loader2, Scale, Sparkles, Trophy, UserCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type ClientProfile = {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  trainerId?: string
  age?: number
  weight?: number
  height?: number
  gender?: string
  phone?: string
  goal?: string
  activityLevel?: string
  medicalConditions?: string
}

type ClientProgress = {
  measurements: Array<{ id?: string; date: string; weight?: number; bodyFat?: number; chest?: number; waist?: number; hips?: number; arm?: number; thigh?: number; notes?: string }>
  achievements: Array<{ id: string; title: string; description: string; unlocked: boolean }>
  routineHistory?: Array<{ assignmentId: string; routineName: string; completedSets: number; totalSets: number; completionRate: number; lastCompletedAt?: string | null }>
  summary: { totalMeasurements: number; latestMeasurement?: { date: string; weight?: number; bodyFat?: number } | null; longestWorkoutStreak: number }
}

interface ClientDetailViewProps {
  clientId: string
}

function StatPill({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card/60 px-4 py-3 backdrop-blur-sm">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

function SectionHeader({ title, description, icon: Icon }: { title: string; description: string; icon?: React.ElementType }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [progress, setProgress] = useState<ClientProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, progressRes] = await Promise.all([
          fetch(`/api/users/${clientId}`, { credentials: 'include' }),
          fetch(`/api/users/${clientId}/progress`, { credentials: 'include' }),
        ])

        const profileData = await profileRes.json().catch(() => null)
        const progressData = await progressRes.json().catch(() => null)

        if (profileRes.ok) setProfile(profileData?.user || null)
        if (progressRes.ok) setProgress(progressData || null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [clientId])

  const completionRate = useMemo(() => {
    if (!progress?.achievements?.length) return 0
    const unlocked = progress.achievements.filter((item) => item.unlocked).length
    return Math.round((unlocked / progress.achievements.length) * 100)
  }, [progress])

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const firstName = profile?.name?.split(' ')[0] || 'Cliente'
  const latestWeight = progress?.summary.latestMeasurement?.weight ?? profile?.weight ?? 'N/D'
  // const latestFat = progress?.summary.latestMeasurement?.bodyFat ?? 'N/D'
  const measurementsCount = progress?.summary.totalMeasurements ?? 0

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-2 sm:px-4 xl:px-2 2xl:px-4">
      <Button variant="ghost" onClick={() => window.history.back()} className="gap-2 px-0 hover:bg-transparent">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-primary/10" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-1">
            <Badge variant="outline" className="gap-1.5 text-xs">
              <LayoutDashboard className="h-3 w-3" />
              Perfil dinámico del cliente
            </Badge>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{profile?.name || 'Cliente'}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">Métricas, cumplimiento y biografía del cliente en una vista clara y rápida.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5"><Sparkles className="h-3 w-3" />{firstName}</Badge>
            <Badge variant="outline" className="gap-1.5"><UserCircle2 className="h-3 w-3" />{profile?.role || 'client'}</Badge>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill icon={Scale} label="Peso" value={`${latestWeight} kg`} accent="bg-primary/10 text-primary" />
          <StatPill icon={CalendarCheck2} label="Cumplimiento" value={`${completionRate}%`} accent="bg-emerald-500/10 text-emerald-600" />
          <StatPill icon={Dumbbell} label="Racha" value={`${progress?.summary.longestWorkoutStreak ?? 0} días`} accent="bg-violet-500/10 text-violet-600" />
          <StatPill icon={Trophy} label="Mediciones" value={measurementsCount} accent="bg-amber-500/10 text-amber-600" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <SectionHeader title="Biografía" description="Información base del cliente vinculada a su cuenta." icon={UserCircle2} />
            </CardHeader>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="rounded-2xl border bg-card/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Correo</p>
                <p className="mt-1 text-sm font-medium">{profile?.email}</p>
              </div>
              <div className="rounded-2xl border bg-card/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Teléfono</p>
                <p className="mt-1 text-sm font-medium">{profile?.phone ?? 'N/D'}</p>
              </div>
              <div className="rounded-2xl border bg-card/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Edad</p>
                <p className="mt-1 text-sm font-medium">{profile?.age ?? 'N/D'}</p>
              </div>
              <div className="rounded-2xl border bg-card/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Género</p>
                <p className="mt-1 text-sm font-medium">{profile?.gender ?? 'N/D'}</p>
              </div>
              <div className="rounded-2xl border bg-card/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Objetivo</p>
                <p className="mt-1 text-sm font-medium">{profile?.goal ?? 'N/D'}</p>
              </div>
              <div className="rounded-2xl border bg-card/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Nivel</p>
                <p className="mt-1 text-sm font-medium">{profile?.activityLevel ?? 'N/D'}</p>
              </div>
              <div className="rounded-2xl border bg-card/60 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Condiciones médicas</p>
                <p className="mt-1 text-sm font-medium">{profile?.medicalConditions || 'Ninguna'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <SectionHeader title="Métricas recientes" description="Últimas mediciones registradas." icon={Scale} />
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {progress?.measurements?.length ? progress.measurements.slice(-5).reverse().map((measurement) => (
                <div key={measurement.id || measurement.date} className="rounded-2xl border bg-card/60 p-4 text-sm shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{new Date(measurement.date).toLocaleDateString('es-ES')}</span>
                    <span className="text-muted-foreground">{measurement.weight ?? 'N/D'} kg · {measurement.bodyFat ?? 'N/D'}% grasa</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">Cintura {measurement.waist ?? 'N/D'} · Pecho {measurement.chest ?? 'N/D'} · Cadera {measurement.hips ?? 'N/D'}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No hay mediciones registradas.</p>}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <SectionHeader title="Historial de cumplimiento" description="Progreso de rutinas y consistencia del cliente." icon={CalendarCheck2} />
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {progress?.routineHistory?.length ? progress.routineHistory.map((item) => (
                <div key={item.assignmentId} className="rounded-2xl border bg-card/60 p-4 text-sm shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.routineName}</p>
                      <p className="text-muted-foreground">{item.completedSets}/{item.totalSets} series cumplidas</p>
                    </div>
                    <Badge variant="secondary">{item.completionRate}%</Badge>
                  </div>
                  {item.lastCompletedAt && <p className="mt-2 text-xs text-muted-foreground">Último registro: {new Date(item.lastCompletedAt).toLocaleString('es-ES')}</p>}
                </div>
              )) : <p className="text-sm text-muted-foreground">No hay historial disponible.</p>}

              <div className="mt-4 grid gap-3">
                {progress?.achievements?.length ? progress.achievements.map((item) => (
                  <div key={item.id} className={`flex items-start justify-between gap-3 rounded-2xl border p-4 ${item.unlocked ? 'bg-primary/5 border-primary/20' : 'bg-card/60'}`}>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant={item.unlocked ? 'secondary' : 'outline'}>{item.unlocked ? 'Logrado' : 'Pendiente'}</Badge>
                  </div>
                )) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
