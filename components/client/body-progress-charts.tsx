"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

type Measurement = {
  date: string
  weight?: number
  bodyFat?: number
  waist?: number
  arm?: number
  hips?: number
  thigh?: number
  chest?: number
}

const weightConfig = {
  weight: { label: "Peso (kg)", color: "hsl(217 91% 60%)" },
} as const

const compositionConfig = {
  bodyFat: { label: "% Grasa", color: "hsl(215 16% 47%)" },
  leanMass: { label: "Masa magra (est.)", color: "hsl(217 91% 60%)" },
} as const

const tensionConfig = {
  value: { label: "Nivel", color: "hsl(217 91% 60%)" },
} as const

function normalizeToPercent(value: number | undefined, max: number): number {
  if (value == null || Number.isNaN(value)) return 0
  return Math.min(100, Math.round((value / max) * 100))
}

export function BodyProgressCharts({ measurements }: { measurements: Measurement[] }) {
  const weightData = measurements.map((item) => ({
    label: new Date(item.date).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
    weight: item.weight ?? null,
  }))

  const compositionData = measurements.map((item) => ({
    label: new Date(item.date).toLocaleDateString("es-ES", { month: "short" }),
    bodyFat: item.bodyFat ?? null,
    leanMass: item.bodyFat != null ? Math.max(0, 100 - item.bodyFat) : null,
  }))

  const latest = measurements.at(-1)
  const tensionData = [
    { part: "Lumbar", value: normalizeToPercent(latest?.waist, 120) },
    { part: "Bíceps", value: normalizeToPercent(latest?.arm, 45) },
    { part: "Cadera", value: normalizeToPercent(latest?.hips, 130) },
    { part: "Muslo", value: normalizeToPercent(latest?.thigh, 70) },
  ]

  const empty = measurements.length === 0

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-xl border bg-card p-3">
        <p className="mb-2 text-xs font-semibold text-foreground">Tendencia de Peso</p>
        {empty ? (
          <p className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">Sin registros aún</p>
        ) : (
          <ChartContainer config={weightConfig} className="h-[120px] w-full">
            <LineChart data={weightData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/40" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} width={32} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="var(--color-weight)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-weight)" }}
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        )}
      </div>

      <div className="rounded-xl border bg-card p-3">
        <p className="mb-2 text-xs font-semibold text-foreground">% Grasa y Masa Muscular</p>
        {empty ? (
          <p className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">Sin registros aún</p>
        ) : (
          <ChartContainer config={compositionConfig} className="h-[120px] w-full">
            <AreaChart data={compositionData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/40" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} width={32} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="bodyFat"
                stackId="1"
                stroke="var(--color-bodyFat)"
                fill="var(--color-bodyFat)"
                fillOpacity={0.35}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="leanMass"
                stackId="1"
                stroke="var(--color-leanMass)"
                fill="var(--color-leanMass)"
                fillOpacity={0.45}
                connectNulls
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>

      <div className="rounded-xl border bg-card p-3">
        <p className="mb-2 text-xs font-semibold text-foreground">Puntos de Tensión Actuales</p>
        {empty ? (
          <p className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">Sin registros aún</p>
        ) : (
          <ChartContainer config={tensionConfig} className="h-[120px] w-full">
            <BarChart data={tensionData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="part" tickLine={false} axisLine={false} width={52} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[0, 6, 6, 0]} barSize={14} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}
