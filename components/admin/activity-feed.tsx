import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface Activity {
  id: string
  user: {
    name: string
    avatar?: string
  }
  action: string
  type: "routine" | "meal_plan" | "user" | "system"
  timestamp: string
}

const mockActivities: Activity[] = [
  {
    id: "1",
    user: { name: "Carlos Martínez", avatar: "/placeholder.svg?key=yoyag" },
    action: "asignó una nueva rutina a Ana García",
    type: "routine",
    timestamp: "Hace 5 minutos",
  },
  {
    id: "2",
    user: { name: "Admin Principal", avatar: "/placeholder.svg?key=78zb5" },
    action: "creó un nuevo usuario entrenador",
    type: "user",
    timestamp: "Hace 1 hora",
  },
  {
    id: "3",
    user: { name: "Carlos Martínez", avatar: "/placeholder.svg?key=yoyag" },
    action: "actualizó el plan alimenticio de Luis Rodríguez",
    type: "meal_plan",
    timestamp: "Hace 2 horas",
  },
  {
    id: "4",
    user: { name: "Sistema", avatar: "/placeholder.svg?key=sys01" },
    action: "generó reporte mensual de métricas",
    type: "system",
    timestamp: "Hace 3 horas",
  },
]

const typeColors = {
  routine: "bg-primary/10 text-primary",
  meal_plan: "bg-accent/10 text-accent",
  user: "bg-chart-3/10 text-chart-3",
  system: "bg-muted text-muted-foreground",
}

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {activity.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm leading-relaxed">
                  <span className="font-medium">{activity.user.name}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-xs ${typeColors[activity.type]}`}>
                    {activity.type === "routine" && "Rutina"}
                    {activity.type === "meal_plan" && "Plan Alimenticio"}
                    {activity.type === "user" && "Usuario"}
                    {activity.type === "system" && "Sistema"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
