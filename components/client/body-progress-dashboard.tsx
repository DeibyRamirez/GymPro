"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BodyProgressCharts } from "@/components/client/body-progress-charts"
import { ArrowLeft, Award, Loader2, PlusCircle, Scale, TrendingUp } from "lucide-react"

const BodyModelViewer = dynamic(
  () => import("@/components/client/body-model-viewer").then((mod) => mod.BodyModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[360px] items-center justify-center rounded-xl border bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
)

type Measurement = {
  id: string
  date: string
  weight?: number
  bodyFat?: number
  chest?: number
  waist?: number
  hips?: number
  arm?: number
  thigh?: number
  notes?: string
}

type Achievement = {
  id: string
  title: string
  description: string
  unlocked: boolean
}

export interface BodyProgressViewProps {
  userId: string
  canEdit?: boolean
  gender?: string | null
}

export function BodyProgressView({ userId, canEdit = true, gender }: BodyProgressViewProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [summary, setSummary] = useState({
    totalMeasurements: 0,
    longestWorkoutStreak: 0,
    latestMeasurement: null as Measurement | null,
  })
  const [form, setForm] = useState({
    date: "",
    weight: "",
    bodyFat: "",
    chest: "",
    waist: "",
    hips: "",
    arm: "",
    thigh: "",
    notes: "",
  })

  const modelType = gender === "femenino" ? "Mujer" : "Hombre"

  useEffect(() => {
    let cancelled = false

    fetch(`/api/users/${userId}/progress`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || cancelled) return
        setMeasurements(data.measurements || [])
        setAchievements(data.achievements || [])
        setSummary(
          data.summary || { totalMeasurements: 0, longestWorkoutStreak: 0, latestMeasurement: null },
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: form.date || undefined,
          weight: form.weight ? Number(form.weight) : undefined,
          bodyFat: form.bodyFat ? Number(form.bodyFat) : undefined,
          chest: form.chest ? Number(form.chest) : undefined,
          waist: form.waist ? Number(form.waist) : undefined,
          hips: form.hips ? Number(form.hips) : undefined,
          arm: form.arm ? Number(form.arm) : undefined,
          thigh: form.thigh ? Number(form.thigh) : undefined,
          notes: form.notes || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMeasurements((current) => [...current, data.measurement])
        setAchievements(data.achievements || [])
        setSummary((current) => ({
          ...current,
          totalMeasurements: current.totalMeasurements + 1,
          latestMeasurement: data.measurement,
        }))
        setForm({ date: "", weight: "", bodyFat: "", chest: "", waist: "", hips: "", arm: "", thigh: "", notes: "" })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[420px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total de registros</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl font-bold">
              <Scale className="h-5 w-5 text-sky-600" />
              {summary.totalMeasurements}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Racha de entreno</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl font-bold">
              <TrendingUp className="h-5 w-5 text-sky-600" />
              {summary.longestWorkoutStreak}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Último peso</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {summary.latestMeasurement?.weight != null ? `${summary.latestMeasurement.weight} kg` : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <div className="grid min-h-[420px] gap-4 lg:grid-cols-2">
              <BodyModelViewer model={modelType} />
              <BodyProgressCharts measurements={measurements} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm xl:max-w-[220px]">
          <CardHeader className="space-y-1 px-4 pb-2 pt-4">
            <CardTitle className="text-base">Logros</CardTitle>
            <CardDescription className="text-xs leading-snug">
              Medallas según tu progreso.
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[420px] space-y-2 overflow-y-auto px-3 pb-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="rounded-lg border bg-muted/20 p-2.5">
                <div className="flex items-start gap-2">
                  <Award
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${achievement.unlocked ? "text-sky-600" : "text-muted-foreground"}`}
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold leading-tight">{achievement.title}</span>
                      <Badge
                        variant={achievement.unlocked ? "default" : "outline"}
                        className="h-5 px-1.5 text-[10px]"
                      >
                        {achievement.unlocked ? "Activo" : "Pendiente"}
                      </Badge>
                    </div>
                    <p className="text-[11px] leading-snug text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {canEdit && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PlusCircle className="h-4 w-4" />
              Nuevo registro antropométrico
            </CardTitle>
            <CardDescription>Guarda peso, grasa corporal y perímetros por fecha.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" value={form.date} onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input id="weight" type="number" step="0.1" value={form.weight} onChange={(e) => setForm((c) => ({ ...c, weight: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFat">% Grasa</Label>
                <Input id="bodyFat" type="number" step="0.1" value={form.bodyFat} onChange={(e) => setForm((c) => ({ ...c, bodyFat: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waist">Cintura (cm)</Label>
                <Input id="waist" type="number" step="0.1" value={form.waist} onChange={(e) => setForm((c) => ({ ...c, waist: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chest">Pecho (cm)</Label>
                <Input id="chest" type="number" step="0.1" value={form.chest} onChange={(e) => setForm((c) => ({ ...c, chest: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hips">Cadera (cm)</Label>
                <Input id="hips" type="number" step="0.1" value={form.hips} onChange={(e) => setForm((c) => ({ ...c, hips: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arm">Brazo (cm)</Label>
                <Input id="arm" type="number" step="0.1" value={form.arm} onChange={(e) => setForm((c) => ({ ...c, arm: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thigh">Muslo (cm)</Label>
                <Input id="thigh" type="number" step="0.1" value={form.thigh} onChange={(e) => setForm((c) => ({ ...c, thigh: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea id="notes" value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end md:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar progreso"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface BodyProgressDashboardProps {
  onBack: () => void
  userId: string
  gender?: string | null
}

export function BodyProgressDashboard({ onBack, userId, gender }: BodyProgressDashboardProps) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver al Dashboard
      </Button>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-balance">Registro Corporal</h2>
        <p className="mt-2 text-muted-foreground">
          Consulta tu evolución, logros y registra nuevas mediciones.
        </p>
      </div>

      <BodyProgressView userId={userId} gender={gender} />
    </div>
  )
}
