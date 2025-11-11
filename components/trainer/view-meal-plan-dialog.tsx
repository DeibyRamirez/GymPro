"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Flame, Clock, Apple } from "lucide-react"
import type { MealPlan } from "@/lib/data"

interface ViewMealPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: MealPlan
}

export function ViewMealPlanDialog({ open, onOpenChange, plan }: ViewMealPlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{plan.name}</DialogTitle>
              <DialogDescription className="mt-2">{plan.description}</DialogDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Flame className="h-3 w-3" />
              {plan.calories} kcal
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
            <div className="flex items-center gap-2">
              <Apple className="h-4 w-4" />
              <span>{plan.meals.length} comidas</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span>{plan.calories} kcal totales</span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {plan.meals.map((meal, index) => (
              <Card key={meal.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{meal.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{meal.time}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Flame className="h-3 w-3" />
                      {meal.calories} kcal
                    </Badge>
                  </div>

                  <div className="pl-11">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Alimentos:</p>
                    <ul className="space-y-1">
                      {meal.foods.map((food, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{food}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
