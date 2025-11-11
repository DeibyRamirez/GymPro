import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Flame } from "lucide-react"
import type { Meal } from "@/lib/data"

interface MealCardProps {
  meal: Meal
}

export function MealCard({ meal }: MealCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{meal.name}</CardTitle>
          <Badge variant="secondary" className="bg-accent/10 text-accent">
            <Flame className="h-3 w-3 mr-1" />
            {meal.calories} kcal
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{meal.time}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Alimentos:</h4>
          <ul className="space-y-1">
            {meal.foods.map((food, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>{food}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
