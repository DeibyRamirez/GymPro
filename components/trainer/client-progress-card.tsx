"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Award, Scale } from "lucide-react"

type ClientProgress = {
  clientName: string
  clientEmail: string
  progressCount: number
  latestMeasurement?: {
    weight?: number
    bodyFat?: number
    date?: string
  }
}

interface ClientProgressCardProps {
  clientProgress: ClientProgress[]
  onOpenClient?: (clientEmail: string) => void
}

export function ClientProgressCard({ clientProgress, onOpenClient }: ClientProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Seguimiento de clientes
        </CardTitle>
        <CardDescription>Resumen rápido de mediciones y actividad reciente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {clientProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay métricas registradas.</p>
        ) : (
          clientProgress.map((client) => (
            <div key={client.clientEmail} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{client.clientName}</p>
                  <p className="text-sm text-muted-foreground">{client.clientEmail}</p>
                </div>
                <Badge variant="secondary">{client.progressCount} registros</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Scale className="h-4 w-4" />{client.latestMeasurement?.weight !== undefined ? `${client.latestMeasurement.weight} kg` : "Sin peso"}</span>
                <span className="flex items-center gap-2"><Award className="h-4 w-4" />{client.latestMeasurement?.bodyFat !== undefined ? `${client.latestMeasurement.bodyFat}% grasa` : "Sin grasa"}</span>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => onOpenClient?.(client.clientEmail)}>
                  Ver progreso
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
