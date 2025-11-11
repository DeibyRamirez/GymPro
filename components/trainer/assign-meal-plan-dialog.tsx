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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { mockMealPlans } from "@/lib/data"
import { Flame } from "lucide-react"

interface AssignMealPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  onAssign: (mealPlanId: string) => void
}

export function AssignMealPlanDialog({ open, onOpenChange, clientName, onAssign }: AssignMealPlanDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("")

  const handleAssign = () => {
    if (selectedPlan) {
      onAssign(selectedPlan)
      onOpenChange(false)
      setSelectedPlan("")
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
          {mockMealPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/5 cursor-pointer"
            >
              <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
              <Label htmlFor={plan.id} className="flex-1 cursor-pointer">
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
