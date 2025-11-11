"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UtensilsCrossed, Flame, ChevronRight } from "lucide-react"
import type { MealPlan } from "@/lib/data"

interface AssignedMealPlanCardProps {
  mealPlan: MealPlan
  onViewDetails: () => void
}

export function AssignedMealPlanCard({ mealPlan, onViewDetails }: AssignedMealPlanCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-accent" />
            Plan Alimenticio
          </CardTitle>
          <Badge variant="secondary" className="bg-accent/10 text-accent">
            <Flame className="h-3 w-3 mr-1" />
            {mealPlan.calories} kcal
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">{mealPlan.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{mealPlan.description}</p>
        </div>

        <div className="text-sm text-muted-foreground">{mealPlan.meals.length} comidas diarias</div>

        <Button onClick={onViewDetails} className="w-full bg-transparent" variant="outline">
          Ver Plan Completo
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
