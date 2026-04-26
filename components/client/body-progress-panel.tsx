"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis } from "recharts"
import { Award, Scale, TrendingDown, Loader2, PlusCircle } from "lucide-react"

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

interface BodyProgressPanelProps {
  userId: string
  canEdit?: boolean
}

const chartConfig = {
  weight: { label: "Peso", color: "hsl(var(--chart-1))" },
  bodyFat: { label: "% Grasa", color: "hsl(var(--chart-2))" },
  waist: { label: "Cintura", color: "hsl(var(--chart-3))" },
} as const

export function BodyProgressPanel({ userId, canEdit = true }: BodyProgressPanelProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [summary, setSummary] = useState<{ totalMeasurements: number; longestWorkoutStreak: number; latestMeasurement: Measurement | null }>({
    totalMeasurements: 0,
    longestWorkoutStreak: 0,
    latestMeasurement: null,
  })

  // Campos del formulario de medición.
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

  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/users/${userId}/progress`, { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          setMeasurements((data.measurements || []).map((item: Measurement) => ({ ...item, date: item.date })))
          setAchievements(data.achievements || [])
          setSummary(data.summary || { totalMeasurements: 0, longestWorkoutStreak: 0, latestMeasurement: null })
        }
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [userId])

  const chartData = useMemo(() => {
    // Normalizamos los datos para que la línea de tiempo quede legible en meses.
    return measurements.map((item) => ({
      month: new Date(item.date).toLocaleDateString("es-ES", { month: "short", year: "2-digit" }),
      weight: item.weight ?? null,
      bodyFat: item.bodyFat ?? null,
      waist: item.waist ?? null,
    }))
  }, [measurements])

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
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de registros</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Scale className="h-5 w-5 text-primary" />
              {summary.totalMeasurements}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Racha de entreno</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <TrendingDown className="h-5 w-5 text-chart-3" />
              {summary.longestWorkoutStreak}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Último peso</CardDescription>
            <CardTitle className="text-3xl">{summary.latestMeasurement?.weight !== undefined ? `${summary.latestMeasurement.weight} kg` : "-"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Seguimiento corporal</CardTitle>
            <CardDescription>Evolución de peso, grasa corporal y cintura.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="weight" stroke="var(--color-weight)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="bodyFat" stroke="var(--color-bodyFat)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="waist" stroke="var(--color-waist)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logros</CardTitle>
            <CardDescription>Medallas automáticas según tu progreso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-start gap-3 rounded-lg border p-3">
                <Award className={`mt-0.5 h-4 w-4 ${achievement.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{achievement.title}</span>
                    <Badge variant={achievement.unlocked ? "default" : "outline"}>{achievement.unlocked ? "Activo" : "Pendiente"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Nuevo registro antropométrico
            </CardTitle>
            <CardDescription>Guarda peso, grasa corporal y perímetros por fecha.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" value={form.date} onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input id="weight" type="number" step="0.1" value={form.weight} onChange={(e) => setForm((current) => ({ ...current, weight: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFat">% Grasa</Label>
                <Input id="bodyFat" type="number" step="0.1" value={form.bodyFat} onChange={(e) => setForm((current) => ({ ...current, bodyFat: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waist">Cintura (cm)</Label>
                <Input id="waist" type="number" step="0.1" value={form.waist} onChange={(e) => setForm((current) => ({ ...current, waist: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chest">Pecho (cm)</Label>
                <Input id="chest" type="number" step="0.1" value={form.chest} onChange={(e) => setForm((current) => ({ ...current, chest: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hips">Cadera (cm)</Label>
                <Input id="hips" type="number" step="0.1" value={form.hips} onChange={(e) => setForm((current) => ({ ...current, hips: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arm">Brazo (cm)</Label>
                <Input id="arm" type="number" step="0.1" value={form.arm} onChange={(e) => setForm((current) => ({ ...current, arm: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thigh">Muslo (cm)</Label>
                <Input id="thigh" type="number" step="0.1" value={form.thigh} onChange={(e) => setForm((current) => ({ ...current, thigh: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea id="notes" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
              </div>
              <div className="md:col-span-2 flex justify-end">
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
