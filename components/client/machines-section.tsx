"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, Activity, TimerReset } from "lucide-react"

const machines = [
  {
    name: "Cinta de correr",
    description: "Cardio para calentamiento, resistencia y quema de calorías.",
    status: "Disponible",
    icon: Activity,
  },
  {
    name: "Prensa de piernas",
    description: "Trabajo guiado de cuádriceps, glúteos e isquiotibiales.",
    status: "Disponible",
    icon: Dumbbell,
  },
  {
    name: "Polea alta",
    description: "Ejercicios de espalda, hombro y brazos con carga variable.",
    status: "Ocupada",
    icon: TimerReset,
  },
  {
    name: "Bicicleta estática",
    description: "Cardio de bajo impacto para sesiones prolongadas.",
    status: "Disponible",
    icon: Activity,
  },
]

export function MachinesSection() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">Máquinas del Gym</h3>
        <p className="text-sm text-muted-foreground">Estado general y uso recomendado</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {machines.map((machine) => {
          const Icon = machine.icon
          return (
            <Card key={machine.name}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {machine.name}
                  </CardTitle>
                  <Badge variant={machine.status === "Disponible" ? "secondary" : "destructive"}>
                    {machine.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{machine.description}</p>
              </CardContent>
            </Card>
          )}
        )}
      </div>
    </div>
    
  )
}
