"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Flame } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MealPlan, Meal } from "@/lib/data";

interface EditMealPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: MealPlan;
  onUpdated?: () => void;
}

interface MealForm extends Omit<Meal, "foods"> {
  foods: string;
}

export function EditMealPlanDialog({
  open,
  onOpenChange,
  plan,
  onUpdated,
}: EditMealPlanDialogProps) {
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description);
  const [totalCalories, setTotalCalories] = useState(plan.calories.toString());
  const [meals, setMeals] = useState<MealForm[]>(
    plan.meals.map((meal) => ({
      ...meal,
      foods: meal.foods.join(", "),
    }))
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(plan.name);
    setDescription(plan.description);
    setTotalCalories(plan.calories.toString());
    setMeals(
      plan.meals.map((meal) => ({
        ...meal,
        foods: meal.foods.join(", "),
      }))
    );
  }, [plan]);

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
    ]);
  };

  const removeMeal = (id: string) => {
    setMeals(meals.filter((meal) => meal.id !== id));
  };

  const updateMeal = (id: string, field: keyof MealForm, value: string | number) => {
    setMeals(meals.map((meal) => (meal.id === id ? { ...meal, [field]: value } : meal)));
  };

  // ✅ Función para mostrar error con detalle
  const handleApiError = async (res: Response) => {
    let message = `Error ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
      else if (data?.message) message = data.message;
    } catch {
      // ignora si no hay JSON
    }
    console.error(`❌ Respuesta del servidor (${res.status}):`, message);
    alert(message);
  };

  // ✅ Actualizar plan
  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedPlan = {
        name,
        description,
        calories: Number(totalCalories),
        meals: meals.map((m) => ({
          ...m,
          foods: m.foods.split(",").map((f) => f.trim()),
        })),
      };

      const planId = plan._id || plan.id;
      if (!planId) {
        alert("Error: el plan no tiene ID válido.");
        return;
      }

      console.log("🧠 ID del plan que se intenta actualizar:", plan._id);
      const res = await fetch(`/api/meal-plans/${plan._id || plan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedPlan),
      });

      if (!res.ok) {
        await handleApiError(res);
        return;
      }

      const data = await res.json();
      console.log("✅ Plan actualizado:", data);
      onOpenChange(false);
      onUpdated?.();
    } catch (err: any) {
      console.error("❌ Error de red o ejecución:", err);
      alert(`Error de red o ejecución: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Eliminar plan
  const handleDeletePlan = async () => {
    if (!confirm("¿Seguro que deseas eliminar este plan alimenticio?")) return;

    setLoading(true);
    try {

      const planId = plan._id || plan.id;
      if (!planId) {
        alert("Error: el plan no tiene ID válido.");
        return;
      }
      const res = await fetch(`/api/meal-plans/${plan._id || plan.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        await handleApiError(res);
        return;
      }

      console.log("🗑️ Plan eliminado correctamente");
      onOpenChange(false);
      onUpdated?.();
    } catch (err: any) {
      console.error("❌ Error de red o ejecución:", err);
      alert(`Error de red o ejecución: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Plan Alimenticio</DialogTitle>
          <DialogDescription>
            Modifica la información del plan y sus comidas
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-plan-name">Nombre del Plan</Label>
                <Input
                  id="edit-plan-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMeal}
                  className="gap-2 bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Comida
                </Button>
              </div>

              {meals.map((meal, index) => (
                <Card key={meal.id || index} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Comida {index + 1}</h4>
                      
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
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
                          value={meal.calories}
                          onChange={(e) =>
                            updateMeal(meal.id, "calories", Number.parseInt(e.target.value) || 0)
                          }
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
          <Button variant="destructive" onClick={handleDeletePlan} disabled={loading}>
            <Trash2 className="h-4 w-4 mr-2" /> Eliminar Plan
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
