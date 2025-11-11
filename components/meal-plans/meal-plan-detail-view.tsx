"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MealCard } from "./meal-card"
import { ArrowLeft, Flame, UtensilsCrossed } from "lucide-react"
import type { MealPlan } from "@/lib/data"

interface MealPlanDetailViewProps {
  mealPlan: MealPlan
  onBack: () => void
}

export function MealPlanDetailView({ mealPlan, onBack }: MealPlanDetailViewProps) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-balance">{mealPlan.name}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">{mealPlan.description}</p>
          </div>
          <Badge variant="secondary" className="bg-accent/10 text-accent text-sm px-3 py-1">
            <Flame className="h-4 w-4 mr-1" />
            {mealPlan.calories} kcal/día
          </Badge>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            <span className="font-medium">{mealPlan.meals.length} comidas diarias</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">Plan Diario</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {mealPlan.meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="bg-muted/50 rounded-lg p-6 space-y-3">
          <h4 className="font-semibold text-lg">Recomendaciones Nutricionales</h4>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <li className="flex gap-2">
              <span className="text-accent font-bold">•</span>
              <span>Bebe al menos 2-3 litros de agua al día</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold">•</span>
              <span>Respeta los horarios de comida para mantener tu metabolismo activo</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold">•</span>
              <span>Puedes ajustar las porciones según tu nivel de hambre y actividad</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold">•</span>
              <span>Prepara tus comidas con anticipación para facilitar el seguimiento</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold">•</span>
              <span>Consulta con tu entrenador si tienes dudas o necesitas hacer cambios</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold">•</span>
              <span>Evita alimentos procesados y azúcares refinados fuera del plan</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-3">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Distribución de Calorías
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {mealPlan.meals.map((meal) => (
              <div key={meal.id} className="space-y-1">
                <p className="text-sm font-medium">{meal.name}</p>
                <p className="text-2xl font-bold text-primary">{meal.calories}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((meal.calories / mealPlan.calories) * 100)}% del total
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
