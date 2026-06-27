"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExercisesLibrary } from "@/components/trainer/exercises-library"
import { GroupClassesPanel } from "@/components/trainer/group-classes-panel"
import { MealPlansLibrary } from "@/components/trainer/meal-plans-library"
import { RoutinesLibrary } from "@/components/trainer/routines-library"
import { DashboardSectionShell } from "@/components/dashboard/dashboard-section-shell"
import { BarChart3, Dumbbell, Library, UtensilsCrossed } from "lucide-react"
import { useState } from "react"

interface TrainerProgramsSectionProps {
  trainerId: string
  onBack: () => void
}

export function TrainerProgramsSection({ trainerId, onBack }: TrainerProgramsSectionProps) {
  const [activeTab, setActiveTab] = useState("routines")

  return (
    <DashboardSectionShell
      title="Programación"
      description="Rutinas, ejercicios, planes alimenticios y clases grupales en módulos separados."
      onBack={onBack}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 p-1 sm:grid-cols-4">
          <TabsTrigger value="routines" className="gap-2 py-3">
            <Dumbbell className="h-4 w-4" />
            Rutinas
          </TabsTrigger>
          <TabsTrigger value="exercises" className="gap-2 py-3">
            <Library className="h-4 w-4" />
            Ejercicios
          </TabsTrigger>
          <TabsTrigger value="meals" className="gap-2 py-3">
            <UtensilsCrossed className="h-4 w-4" />
            Planes
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2 py-3">
            <BarChart3 className="h-4 w-4" />
            Clases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routines">
          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Biblioteca de rutinas
              </CardTitle>
              <CardDescription>Crea, edita y asigna rutinas de entrenamiento.</CardDescription>
            </CardHeader>
            <CardContent>
              <RoutinesLibrary trainerId={trainerId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises">
          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                Mis ejercicios
              </CardTitle>
              <CardDescription>
                Biblioteca personal reutilizable al crear rutinas. Series, reps y descanso son valores de referencia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExercisesLibrary trainerId={trainerId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meals">
          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Planes alimenticios
              </CardTitle>
              <CardDescription>Diseña y asigna planes de nutrición a tus clientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <MealPlansLibrary trainerId={trainerId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Clases grupales
              </CardTitle>
              <CardDescription>Organiza sesiones colectivas y horarios.</CardDescription>
            </CardHeader>
            <CardContent>
              <GroupClassesPanel trainerId={trainerId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardSectionShell>
  )
}
