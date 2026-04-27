"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/hooks/use-toast"
import { Flame } from "lucide-react"
import { useEffect, useState } from "react"

interface AssignMealPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  onAssign: (mealPlanId: string) => Promise<void> | void
}

type MealPlanOption = {
  _id?: string
  id?: string
  name: string
  description: string
  calories: number
  meals: unknown[]
}

export function AssignMealPlanDialog({ open, onOpenChange, clientName, onAssign }: AssignMealPlanDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [mealPlans, setMealPlans] = useState<MealPlanOption[]>([])
  const visibleMealPlans = mealPlans
    .map((plan) => ({ ...plan, mealPlanId: plan.id || plan._id }))
    .filter((plan) => Boolean(plan.mealPlanId)) as Array<MealPlanOption & { mealPlanId: string }>

  useEffect(() => {
    if (!open) return

    let active = true

    const loadMealPlans = async () => {
      try {
        const res = await fetch('/api/meal-plans?limit=100', { credentials: 'include' })
        const data = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(data?.error || 'No se pudieron cargar los planes alimenticios')
        }

        if (active) {
          setMealPlans(data?.mealPlans || [])
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudieron cargar los planes alimenticios'
        toast({
          title: 'Error al cargar planes',
          description: message,
          variant: 'destructive',
        })
        if (active) {
          setMealPlans([])
        }
      }
    }

    loadMealPlans()

    
    return () => {
      active = false
    }
  }, [open])

  const handleAssign = async () => {
    if (!selectedPlan) return

    try {
      await Promise.resolve(onAssign(selectedPlan))
      onOpenChange(false)
      setSelectedPlan("")
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo asignar el plan alimenticio'
      toast({
        title: 'Error al asignar',
        description: message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Plan Alimenticio a {clientName}</DialogTitle>
          <DialogDescription>Selecciona un plan de alimentación para asignar al cliente</DialogDescription>
        </DialogHeader>

        <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-3">
          {visibleMealPlans.map((plan) => (
            <div
              key={plan.mealPlanId}
              className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/5 cursor-pointer"
            >
              <RadioGroupItem value={plan.mealPlanId} id={plan.mealPlanId} className="mt-1" />
              <Label htmlFor={plan.mealPlanId} className="flex-1 cursor-pointer">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{plan.name}</h4>
                    <Badge variant="secondary" className="bg-accent/10 text-accent">
                      <Flame className="h-3 w-3 mr-1" />
                      {plan.calories} kcal
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="text-xs text-muted-foreground">{plan.meals.length} comidas diarias</div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={!selectedPlan}>
            Asignar Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
