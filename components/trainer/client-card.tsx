"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dumbbell, UtensilsCrossed } from "lucide-react"
import type { User } from "@/lib/auth"

interface ClientCardProps {
  client: User
  hasRoutine: boolean
  hasMealPlan: boolean
  onAssignRoutine: () => void
  onAssignMealPlan: () => void
  onViewDetails: () => void
}

export function ClientCard({
  client,
  hasRoutine,
  hasMealPlan,
  onAssignRoutine,
  onAssignMealPlan,
  onViewDetails,
}: ClientCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14">
            <AvatarImage src={client.avatar || "/placeholder.svg"} alt={client.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {client.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-none">{client.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{client.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
          {hasRoutine ? (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Rutina Asignada
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Sin rutina</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          {hasMealPlan ? (
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              Plan Asignado
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Sin plan alimenticio</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onAssignRoutine} className="flex-1 bg-transparent">
          <Dumbbell className="h-4 w-4 mr-1" />
          Rutina
        </Button>
        <Button variant="outline" size="sm" onClick={onAssignMealPlan} className="flex-1 bg-transparent">
          <UtensilsCrossed className="h-4 w-4 mr-1" />
          Plan
        </Button>
        <Button size="sm" onClick={onViewDetails} className="flex-1">
          Ver Detalles
        </Button>
      </CardFooter>
    </Card>
  )
}
