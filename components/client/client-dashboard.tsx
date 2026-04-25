"use client"

import { useState, useEffect } from "react"
import { TrainerInfoCard } from "./trainer-info-card"
import { ProgressOverview } from "./progress-overview"
import { AssignedRoutineCard } from "./assigned-routine-card"
import { AssignedMealPlanCard } from "./assigned-meal-plan-card"
import { QuickActions } from "./quick-actions"
import { ClientProfile } from "./client-profile"
import { CreateRoutineDialog } from "./create-routine-dialog"
import { RoutineDetailView } from "@/components/routines/routine-detail-view"
import { MealPlanDetailView } from "@/components/meal-plans/meal-plan-detail-view"
import { CalendarDashboard } from "./calendar-dashboard"
import { Storefront } from "./storefront"
import { MachinesSection } from "./machines-section"
import { Button } from "@/components/ui/button"
import { Plus, User as UserIcon, Loader2 } from "lucide-react"
import type { User } from "@/lib/auth"

interface ClientDashboardProps {
  client: User
}

interface Routine {
  id: string
  name: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  exercises: Array<{
    _id?: string
    exercise: {
      _id: string
      name: string
      image?: string
      instructions?: string
      muscleGroups?: string[]
      equipment?: string[]
      sets?: number
      reps?: string
      rest?: string
      difficulty?: 'beginner' | 'intermediate' | 'advanced'
    }
    sets: number
    reps: string
    rest: string
    instructions: string
    order?: number
  }>
  createdBy: string
  assignmentId?: string
  routineProgress?: Array<{ routineId: string; exerciseId: string; setNumber: number; completedAt: string }>
}

interface MealPlan {
  id: string
  name: string
  description: string
  calories: number
  meals: unknown[]
  createdBy: string
}

interface Trainer {
  id: string
  name: string
  email: string
  avatar?: string
  phone?: string
}

export function ClientDashboard({ client }: ClientDashboardProps) {
  const [viewingRoutine, setViewingRoutine] = useState<Routine | null>(null)
  const [viewingMealPlan, setViewingMealPlan] = useState<MealPlan | null>(null)
  const [viewingCalendar, setViewingCalendar] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showCreateRoutine, setShowCreateRoutine] = useState(false)
  const [loading, setLoading] = useState(true)
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [trainer, setTrainer] = useState<Trainer | null>(null)

  // Cargar datos del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        const assignmentsResponse = await fetch("/api/assignments", { credentials: "include" })
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json()
          const activeAssignment = assignmentsData.assignments?.find((item: { routineId?: Routine }) => item.routineId)
          if (activeAssignment?.routineId) {
            setRoutine({
              ...activeAssignment.routineId,
              id: activeAssignment.routineId.id || activeAssignment.routineId._id,
              assignmentId: activeAssignment.id || activeAssignment._id,
              routineProgress: activeAssignment.routineProgress || [],
            })
          }
        }

        const mealPlansResponse = await fetch("/api/meal-plans?limit=1", { credentials: "include" })
        if (mealPlansResponse.ok) {
          const mealPlansData = await mealPlansResponse.json()
          if (mealPlansData.mealPlans && mealPlansData.mealPlans.length > 0) {
            setMealPlan(mealPlansData.mealPlans[0])
          }
        }

        if (client.trainerId) {
          const trainerResponse = await fetch(`/api/users/${client.trainerId}`, { credentials: "include" })
          if (trainerResponse.ok) {
            const trainerData = await trainerResponse.json()
            setTrainer(trainerData.user)
          }
        }
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [client.trainerId, client.id])

  const handleRoutineCreated = () => {
    fetch("/api/assignments", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        const activeAssignment = data.assignments?.find((item: { routineId?: Routine }) => item.routineId)
        if (activeAssignment?.routineId) {
          setRoutine({
            ...activeAssignment.routineId,
            id: activeAssignment.routineId.id || activeAssignment.routineId._id,
            assignmentId: activeAssignment.id || activeAssignment._id,
            routineProgress: activeAssignment.routineProgress || [],
          })
        }
      })
    setShowCreateRoutine(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (viewingRoutine) {
    return <RoutineDetailView routine={viewingRoutine} onBack={() => setViewingRoutine(null)} />
  }

  if (viewingMealPlan) {
    return <MealPlanDetailView mealPlan={viewingMealPlan} onBack={() => setViewingMealPlan(null)} />
  }

  if (viewingCalendar) {
    return <CalendarDashboard onBack={() => setViewingCalendar(false)} assignmentId={routine?.assignmentId} />
  }

  if (showProfile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
            <p className="text-muted-foreground mt-2">Actualiza tu información personal y del gimnasio</p>
          </div>
          <Button variant="outline" onClick={() => setShowProfile(false)}>
            Volver al Dashboard
          </Button>
        </div>
        <ClientProfile clientId={client.id} onUpdate={() => setShowProfile(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-balance">Bienvenido, {client.name.split(" ")[0]}</h2>
          <p className="text-muted-foreground mt-2">Aquí está tu resumen de progreso y plan de entrenamiento</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowProfile(true)}>
            <UserIcon className="mr-2 h-4 w-4" />
            Mi Perfil
          </Button>
          <Button onClick={() => setShowCreateRoutine(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Rutina
          </Button>
        </div>
      </div>

      <ProgressOverview clientId={client.id} />

      <Storefront />

      <MachinesSection />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {trainer && <TrainerInfoCard trainer={trainer} />}

          <div className="grid gap-6 md:grid-cols-2">
          {routine ? (
              <AssignedRoutineCard routine={routine} onViewDetails={() => setViewingRoutine(routine)} />
            ) : (
              <div className="p-6 border rounded-lg bg-muted/50 text-center">
                <p className="text-muted-foreground">Aún no tienes una rutina asignada</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => setShowCreateRoutine(true)}
                >
                  Crear mi primera rutina
                </Button>
              </div>
            )}

            {mealPlan ? (
              <AssignedMealPlanCard mealPlan={mealPlan} onViewDetails={() => setViewingMealPlan(mealPlan)} />
            ) : (
              <div className="p-6 border rounded-lg bg-muted/50 text-center">
                <p className="text-muted-foreground">Aún no tienes un plan alimenticio asignado</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <QuickActions onCalendarClick={() => setViewingCalendar(true)} />
        </div>
      </div>

      <CreateRoutineDialog 
        open={showCreateRoutine} 
        onOpenChange={setShowCreateRoutine}
        onSuccess={handleRoutineCreated}
      />
    </div>
  )
}
