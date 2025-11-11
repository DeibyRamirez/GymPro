"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, Flame } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { MealPlan, Meal } from "@/lib/data"

interface EditMealPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: MealPlan
}

interface MealForm extends Meal {
  foods: string
}

export function EditMealPlanDialog({ open, onOpenChange, plan }: EditMealPlanDialogProps) {
  const [name, setName] = useState(plan.name)
  const [description, setDescription] = useState(plan.description)
  const [totalCalories, setTotalCalories] = useState(plan.calories.toString())
  const [meals, setMeals] = useState<MealForm[]>(
    plan.meals.map((meal) => ({
      ...meal,
      foods: meal.foods.join(", "),
    })),
  )

  useEffect(() => {
    setName(plan.name)
    setDescription(plan.description)
    setTotalCalories(plan.calories.toString())
    setMeals(
      plan.meals.map((meal) => ({
        ...meal,
        foods: meal.foods.join(", "),
      })),
    )
  }, [plan])

  const addMeal = () => {
    setMeals([
      ...meals,
      {
        id: Date.now().toString(),
        name: "",
        time: "",
        foods: "",
        calories: 0,
      },
    ])
  }

  const removeMeal = (id: string) => {
    setMeals(meals.filter((meal) => meal.id !== id))
  }

  const updateMeal = (id: string, field: keyof MealForm, value: string | number) => {
    setMeals(meals.map((meal) => (meal.id === id ? { ...meal, [field]: value } : meal)))
  }

  const handleSave = () => {
    console.log("Guardar cambios:", { name, description, totalCalories, meals })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Plan Alimenticio</DialogTitle>
          <DialogDescription>Modifica la información del plan y sus comidas</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-plan-name">Nombre del Plan</Label>
                <Input id="edit-plan-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-calories">Calorías Totales</Label>
                <div className="relative">
                  <Input
                    id="edit-calories"
                    type="number"
                    value={totalCalories}
                    onChange={(e) => setTotalCalories(e.target.value)}
                    className="pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm text-muted-foreground">
                    <Flame className="h-4 w-4" />
                    <span>kcal</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-plan-description">Descripción</Label>
              <Textarea
                id="edit-plan-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Comidas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Comidas del Día</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMeal} className="gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Agregar Comida
                </Button>
              </div>

              {meals.map((meal, index) => (
                <Card key={meal.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Comida {index + 1}</h4>
                      {meals.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeMeal(meal.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input value={meal.name} onChange={(e) => updateMeal(meal.id, "name", e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label>Horario</Label>
                        <Input
                          type="time"
                          value={meal.time}
                          onChange={(e) => updateMeal(meal.id, "time", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Calorías</Label>
                        <Input
                          type="number"
                          value={meal.calories}
                          onChange={(e) => updateMeal(meal.id, "calories", Number.parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Alimentos (separados por coma)</Label>
                      <Textarea
                        value={meal.foods}
                        onChange={(e) => updateMeal(meal.id, "foods", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
