"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, FileDown, FileText, Loader2 } from "lucide-react"

type Measurement = {
  date: string
  weight?: number
  bodyFat?: number
  chest?: number
  waist?: number
}

interface ReportsDashboardProps {
  onBack: () => void
  userId: string
}

export function ReportsDashboard({ onBack, userId }: ReportsDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [measurements, setMeasurements] = useState<Measurement[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/users/${userId}/progress`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setMeasurements(data.measurements || [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  const exportCsv = () => {
    const header = ["fecha", "peso", "grasa", "pecho", "cintura"]
    const rows = measurements.map((m) => [m.date, m.weight ?? "", m.bodyFat ?? "", m.chest ?? "", m.waist ?? ""])
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-progreso-${userId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver al Dashboard
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Reportes</h2>
          <p className="text-muted-foreground mt-2">Descarga tu progreso en Excel o PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={loading}>
            <FileDown className="mr-2 h-4 w-4" /> Excel / CSV
          </Button>
          <Button onClick={exportPdf} disabled={loading}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : measurements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay mediciones para generar reportes.</p>
          ) : (
            <div className="space-y-3">
              {measurements.map((m, index) => (
                <div key={`${m.date}-${index}`} className="rounded-lg border p-3 text-sm">
                  <div className="font-medium">{new Date(m.date).toLocaleDateString('es-ES')}</div>
                  <div className="text-muted-foreground">Peso: {m.weight ?? '-'} kg | Grasa: {m.bodyFat ?? '-'}% | Cintura: {m.waist ?? '-'} cm</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
