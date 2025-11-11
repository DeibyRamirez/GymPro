"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, TrendingUp, FileText } from "lucide-react"

interface QuickActionsProps {
  onCalendarClick?: () => void
}

export function QuickActions({ onCalendarClick }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button variant="outline" className="justify-start h-auto py-3 bg-transparent" onClick={onCalendarClick}>
          <Calendar className="h-5 w-5 mr-3 text-primary" />
          <div className="text-left">
            <div className="font-medium">Ver Calendario</div>
            <div className="text-xs text-muted-foreground">Próximas sesiones</div>
          </div>
        </Button>

        <Button variant="outline" className="justify-start h-auto py-3 bg-transparent">
          <TrendingUp className="h-5 w-5 mr-3 text-accent" />
          <div className="text-left">
            <div className="font-medium">Registrar Progreso</div>
            <div className="text-xs text-muted-foreground">Peso, medidas, fotos</div>
          </div>
        </Button>

        <Button variant="outline" className="justify-start h-auto py-3 bg-transparent">
          <MessageSquare className="h-5 w-5 mr-3 text-chart-3" />
          <div className="text-left">
            <div className="font-medium">Mensajes</div>
            <div className="text-xs text-muted-foreground">Habla con tu entrenador</div>
          </div>
        </Button>

        <Button variant="outline" className="justify-start h-auto py-3 bg-transparent">
          <FileText className="h-5 w-5 mr-3 text-chart-4" />
          <div className="text-left">
            <div className="font-medium">Mis Reportes</div>
            <div className="text-xs text-muted-foreground">Historial y estadísticas</div>
          </div>
        </Button>
      </CardContent>
    </Card>
  )
}
