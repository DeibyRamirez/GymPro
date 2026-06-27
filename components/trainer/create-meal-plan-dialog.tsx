"use client"

import { useState } from "react"
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
import { CloudinaryImageUpload } from "@/components/ui/cloudinary-image-upload"
import { Plus, Trash2, Flame } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CreateMealPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface MealForm {
  id: string
  name: string
  time: string
  foods: string
  calories: string
  protein: string
  carbs: string
  fats: string
  images: string[]
}

export function CreateMealPlanDialog({ open, onOpenChange, onSuccess }: CreateMealPlanDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [totalCalories, setTotalCalories] = useState("")
  const [goal, setGoal] = useState<"definicion" | "volumen" | "mantenimiento">("mantenimiento")
  const [meals, setMeals] = useState<MealForm[]>([
    {
      id: "1",
      name: "",
      time: "",
      foods: "",
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
      images: [],
    },
  ])

  const getSuggestedCalories = (selectedGoal: typeof goal) => {
    if (selectedGoal === "definicion") return "1800"
    if (selectedGoal === "volumen") return "2800"
    return "2200"
  }

  const addMeal = () => {
    setMeals([
      ...meals,
        {
          id: Date.now().toString(),
          name: "",
          time: "",
          foods: "",
          calories: "",
          protein: "",
          carbs: "",
          fats: "",
          images: [],
        },
      ])
  }

  const removeMeal = (id: string) => {
    setMeals(meals.filter((meal) => meal.id !== id))
  }

  const updateMeal = (id: string, field: keyof MealForm, value: string | string[]) => {
    setMeals(meals.map((meal) => (meal.id === id ? { ...meal, [field]: value } : meal)))
  }

  const handleCreate = async () => {
    if (!name || !totalCalories || meals.length === 0 || meals.some(m => !m.name || !m.calories)) {
      alert("Completa todos los campos requeridos")
      return
    }

    const payload = {
      name,
      description,
      calories: parseInt(totalCalories),
      duration: 1, // ✅ número, no texto
      meals: meals.map(m => ({
        name: m.name,
        time: m.time,
        foods: m.foods.split(',').map(f => f.trim()), // ✅ arreglo
        calories: parseInt(m.calories),
        macros: {
          protein: parseInt(m.protein) || 0,
          carbs: parseInt(m.carbs) || 0,
          fats: parseInt(m.fats) || 0,
        },
        images: m.images,
      })),
      tags: []
    }


    try {
      const response = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Error al crear")
      }

      onOpenChange(false)
      setName("")
      setDescription("")
      setTotalCalories("")
      setGoal("mantenimiento")
      setMeals([{ id: "1", name: "", time: "", foods: "", calories: "", protein: "", carbs: "", fats: "", images: [] }])
      if (onSuccess) onSuccess()
      // window.location.reload()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al crear el plan")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Plan Alimenticio</DialogTitle>
          <DialogDescription>Completa la información del plan y agrega las comidas del día</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Nombre del Plan</Label>
                <Input
                  id="plan-name"
                  placeholder="Ej: Plan Definición"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calories">Calorías Totales</Label>
                <div className="relative">
                  <Input
                    id="calories"
                    type="number"
                    placeholder="2000"
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
              <Label>Objetivo nutricional</Label>
              <div className="flex flex-wrap gap-2">
                {(["definicion", "volumen", "mantenimiento"] as const).map((item) => (
                  <Button key={item} type="button" variant={goal === item ? "default" : "outline"} onClick={() => { setGoal(item); setTotalCalories(getSuggestedCalories(item)) }}>
                    {item === "definicion" ? "Definición" : item === "volumen" ? "Volumen" : "Mantenimiento"}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Sugerencia automática: {getSuggestedCalories(goal)} kcal/día</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-description">Descripción</Label>
              <Textarea
                id="plan-description"
                placeholder="Describe el objetivo y características del plan..."
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
                        <Input
                          placeholder="Ej: Desayuno"
                          value={meal.name}
                          onChange={(e) => updateMeal(meal.id, "name", e.target.value)}
                        />
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
                          placeholder="400"
                          value={meal.calories}
                          onChange={(e) => updateMeal(meal.id, "calories", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Proteínas (g)</Label>
                        <Input type="number" placeholder="35" value={meal.protein} onChange={(e) => updateMeal(meal.id, "protein", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Carbohidratos (g)</Label>
                        <Input type="number" placeholder="50" value={meal.carbs} onChange={(e) => updateMeal(meal.id, "carbs", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Grasas (g)</Label>
                        <Input type="number" placeholder="12" value={meal.fats} onChange={(e) => updateMeal(meal.id, "fats", e.target.value)} />
                      </div>
                    </div>

                    <CloudinaryImageUpload
                      label="Imágenes de la comida"
                      value={meal.images}
                      onChange={(images) => updateMeal(meal.id, "images", images)}
                      folder="gympro/meals"
                    />

                    <div className="space-y-2">
                      <Label>Alimentos (separados por coma)</Label>
                      <Textarea
                        placeholder="Ej: 3 claras de huevo, Avena 50g, Plátano, Café"
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
          <Button onClick={handleCreate}>Crear Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
