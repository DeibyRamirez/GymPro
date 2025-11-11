"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientsView } from "./clients-view"
import { RoutinesLibrary } from "./routines-library"
import { MealPlansLibrary } from "./meal-plans-library"
import { Users, Dumbbell, UtensilsCrossed, BarChart3 } from "lucide-react"
import { Card } from "@/components/ui/card"

interface TrainerDashboardProps {
  trainerId: string
}

export function TrainerDashboard({ trainerId }: TrainerDashboardProps) {
  const [activeTab, setActiveTab] = useState("clients")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Panel de Entrenador
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">Gestiona tus clientes, rutinas y planes alimenticios</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4 border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Clientes Activos</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-accent bg-gradient-to-br from-accent/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Dumbbell className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-muted-foreground">Rutinas Creadas</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-chart-3 bg-gradient-to-br from-chart-3/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <UtensilsCrossed className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-xs text-muted-foreground">Planes Alimenticios</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-chart-4 bg-gradient-to-br from-chart-4/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-4/10">
                <BarChart3 className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">94%</p>
                <p className="text-xs text-muted-foreground">Tasa de Adherencia</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="clients" className="gap-2 py-3">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Mis Clientes</span>
            <span className="sm:hidden">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="routines" className="gap-2 py-3">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Biblioteca de Rutinas</span>
            <span className="sm:hidden">Rutinas</span>
          </TabsTrigger>
          <TabsTrigger value="meals" className="gap-2 py-3">
            <UtensilsCrossed className="h-4 w-4" />
            <span className="hidden sm:inline">Planes Alimenticios</span>
            <span className="sm:hidden">Planes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <ClientsView trainerId={trainerId} />
        </TabsContent>

        <TabsContent value="routines" className="space-y-4">
          <RoutinesLibrary trainerId={trainerId} />
        </TabsContent>

        <TabsContent value="meals" className="space-y-4">
          <MealPlansLibrary trainerId={trainerId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
