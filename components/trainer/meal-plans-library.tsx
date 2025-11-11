"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, UtensilsCrossed, Flame, Apple, Edit, Trash2, Eye, Copy } from "lucide-react"
import { mockMealPlans, type MealPlan } from "@/lib/data"
import { CreateMealPlanDialog } from "./create-meal-plan-dialog"
import { EditMealPlanDialog } from "./edit-meal-plan-dialog"
import { ViewMealPlanDialog } from "./view-meal-plan-dialog"

interface MealPlansLibraryProps {
  trainerId: string
}

export function MealPlansLibrary({ trainerId }: MealPlansLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)

  const filteredPlans = mockMealPlans.filter(
    (plan) =>
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getCalorieColor = (calories: number) => {
    if (calories < 2000) return "text-blue-600 dark:text-blue-400"
    if (calories < 2500) return "text-green-600 dark:text-green-400"
    return "text-orange-600 dark:text-orange-400"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar planes alimenticios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Nuevo Plan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans.map((plan) => (
          <Card
            key={plan.id}
            className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-accent/50"
          >
            {/* Header de la tarjeta con gradiente */}
            <div className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-6 border-b">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <UtensilsCrossed className="h-6 w-6 text-accent" />
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Flame className="h-3 w-3" />
                  {plan.calories} kcal
                </Badge>
              </div>
              <h3 className="font-bold text-xl mb-2 text-balance">{plan.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 text-pretty">{plan.description}</p>
            </div>

            {/* Información del plan */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Apple className="h-4 w-4" />
                  <span>{plan.meals.length} comidas</span>
                </div>
                <div className={`flex items-center gap-2 font-semibold ${getCalorieColor(plan.calories)}`}>
                  <Flame className="h-4 w-4" />
                  <span>{plan.calories} kcal/día</span>
                </div>
              </div>

              {/* Lista de comidas */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Comidas incluidas:</p>
                <div className="flex flex-wrap gap-1">
                  {plan.meals.map((meal) => (
                    <Badge key={meal.id} variant="outline" className="text-xs">
                      {meal.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 bg-transparent"
                  onClick={() => {
                    setSelectedPlan(plan)
                    setViewDialogOpen(true)
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 bg-transparent"
                  onClick={() => {
                    setSelectedPlan(plan)
                    setEditDialogOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => console.log("Duplicar", plan.id)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => console.log("Eliminar", plan.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Diálogos */}
      <CreateMealPlanDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      {selectedPlan && (
        <>
          <EditMealPlanDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} plan={selectedPlan} />
          <ViewMealPlanDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen} plan={selectedPlan} />
        </>
      )}
    </div>
  )
}
