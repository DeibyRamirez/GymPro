"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, Flame, Activity, Loader2 } from "lucide-react"

interface ProgressOverviewProps {
  clientId: string
}

export function ProgressOverview({ clientId }: ProgressOverviewProps) {
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [workoutsCount, setWorkoutsCount] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar datos del usuario
        const profileResponse = await fetch("/api/users/profile")
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setUserData(profileData.user)
        }

        // Cargar eventos de entrenamiento del mes actual
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        
        const calendarResponse = await fetch(
          `/api/calendar?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}&type=workout`
        )
        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json()
          const completedWorkouts = calendarData.events?.filter((e: any) => e.completed) || []
          setWorkoutsCount(completedWorkouts.length)
        }
      } catch (error) {
        console.error("Error cargando datos de progreso:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clientId])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const weight = userData?.weight || 0
  const goalWeight = userData?.goal === 'perder_peso' ? (weight - 5) : (userData?.goal === 'ganar_masa' ? (weight + 5) : weight)
  const weightProgress = goalWeight !== weight ? Math.abs(((weight - goalWeight) / Math.abs(goalWeight - weight)) * 100) : 0
  const workoutsThisMonth = workoutsCount
  const targetWorkouts = 16
  const workoutsProgress = targetWorkouts > 0 ? (workoutsThisMonth / targetWorkouts) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entrenamientos</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{workoutsThisMonth}/{targetWorkouts}</div>
          <Progress value={workoutsProgress} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round(workoutsProgress)}% completado este mes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Calorías Hoy</CardTitle>
          <Flame className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">-</div>
          <Progress value={0} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">Registra tu consumo diario</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Peso Actual</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {weight > 0 ? `${weight} kg` : "-"}
          </div>
          {weight > 0 && goalWeight !== weight && (
            <p className="text-xs text-primary mt-2">
              {userData?.goal === 'perder_peso' ? 'Meta: ' : 'Meta: '}
              {goalWeight} kg
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Objetivo</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {userData?.goal ? 
              userData.goal === 'perder_peso' ? 'Perder Peso' :
              userData.goal === 'ganar_masa' ? 'Ganar Masa' :
              userData.goal === 'mantenimiento' ? 'Mantenimiento' :
              userData.goal === 'tonificar' ? 'Tonificar' :
              userData.goal === 'resistencia' ? 'Resistencia' : 'Otro'
              : '-'
            }
          </div>
          {weight > 0 && goalWeight !== weight && (
            <Progress value={Math.min(weightProgress, 100)} className="mt-2" />
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {userData?.activityLevel ? 
              `Nivel: ${userData.activityLevel === 'principiante' ? 'Principiante' : 
                       userData.activityLevel === 'intermedio' ? 'Intermedio' : 'Avanzado'}`
              : 'Actualiza tu perfil'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
