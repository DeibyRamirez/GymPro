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
import { CalendarDashboard } from "./calendar-dashboard"
import { BodyProgressPanel } from "./body-progress-panel"
import { Button } from "@/components/ui/button"
import { Plus, User as UserIcon, Loader2, LayoutDashboard, CalendarDays, Medal, Scale, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/lib/auth"
import type { Routine as BaseRoutine } from "@/lib/data"

interface ClientDashboardProps {
  client: User
}

type AssignedRoutineForView = Omit<BaseRoutine, 'exercises'> & {
  assignmentId?: string
  routineProgress?: Array<{ routineId: string; exerciseId: string; setNumber: number; completedAt: string }>
  exercises: Array<{
    _id?: string
    exercise: {
      _id: string
      name: string
      image?: string
      instructions?: string
    }
    sets: number
    reps: string
    rest: string
    instructions: string
  }>
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
  const [viewingRoutine, setViewingRoutine] = useState<AssignedRoutineForView | null>(null)
  const [viewingMealPlan, setViewingMealPlan] = useState<MealPlan | null>(null)
  const [viewingCalendar, setViewingCalendar] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showCreateRoutine, setShowCreateRoutine] = useState(false)
  const [loading, setLoading] = useState(true)
  const [routine, setRoutine] = useState<AssignedRoutineForView | null>(null)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [trainer, setTrainer] = useState<Trainer | null>(null)

  const openCalendar = () => setViewingCalendar(true)

  // Cargar datos del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        const assignmentsResponse = await fetch("/api/assignments", { credentials: "include" })
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json()
          const activeAssignment = assignmentsData.assignments?.[0]
          if (activeAssignment?.routineId) {
            setRoutine({
              ...activeAssignment.routineId,
              id: activeAssignment.routineId.id || activeAssignment.routineId._id,
              assignmentId: activeAssignment.id || activeAssignment._id,
              routineProgress: activeAssignment.routineProgress || [],
            } as AssignedRoutineForView)
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
        const activeAssignment = data.assignments?.[0]
        if (activeAssignment?.routineId) {
          setRoutine({
            ...activeAssignment.routineId,
            id: activeAssignment.routineId.id || activeAssignment.routineId._id,
            assignmentId: activeAssignment.id || activeAssignment._id,
            routineProgress: activeAssignment.routineProgress || [],
          } as AssignedRoutineForView)
        }
      })
    setShowCreateRoutine(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (viewingRoutine) {
    return <RoutineDetailView routine={viewingRoutine} onBack={() => setViewingRoutine(null)} />
  }

  if (viewingCalendar) {
    return <CalendarDashboard onBack={() => setViewingCalendar(false)} assignmentId={routine?.assignmentId} />
  }

  if (showProfile) {
    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between gap-4">
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
    <div className="w-full space-y-8 xl:px-2 2xl:px-4">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge variant="outline" className="w-fit gap-2"><LayoutDashboard className="h-3 w-3" /> Panel del cliente</Badge>
                <div>
                  <h2 className="text-4xl font-black tracking-tight text-balance">Bienvenido, {client.name.split(" ")[0]}</h2>
                  <p className="mt-2 max-w-2xl text-muted-foreground">Seguimiento corporal, logros, calendario y registro antropométrico en una sola vista.</p>
                </div>
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
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Seguimiento corporal</p>
                <p className="mt-2 text-3xl font-black">Activo</p>
                <p className="text-xs text-muted-foreground">Peso, medidas y evolución</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Logros</p>
                <p className="mt-2 text-3xl font-black">Medallas</p>
                <p className="text-xs text-muted-foreground">Reconocimientos automáticos</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Calendario</p>
                <p className="mt-2 text-3xl font-black">Hoy</p>
                <p className="text-xs text-muted-foreground">Sesiones y eventos</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Registro antropométrico</p>
                <p className="mt-2 text-3xl font-black">Nuevo</p>
                <p className="text-xs text-muted-foreground">Altas rápidas desde el panel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <QuickActions onCalendarClick={openCalendar} />
      </section>

      <ProgressOverview clientId={client.id} />

      <section id="seguimiento-corporal" className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="min-h-[520px]">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><Scale className="h-4 w-4" /> Seguimiento corporal</CardTitle>
                <CardDescription>Evolución de peso, grasa corporal y cintura.</CardDescription>
              </div>
              <Badge variant="secondary">Registro vivo</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-full">
            <BodyProgressPanel userId={client.id} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="min-h-[200px]" id="logros">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Medal className="h-4 w-4" /> Logros</CardTitle>
              <CardDescription>Medallas automáticas y estado de avance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border p-4">
                <p className="font-medium">Primer registro</p>
                <p className="text-sm text-muted-foreground">Ya guardaste tu primera medición corporal.</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="font-medium">Racha consistente</p>
                <p className="text-sm text-muted-foreground">Sigue entrenando para desbloquear más logros.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[200px]" id="calendario">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Calendario</CardTitle>
              <CardDescription>Acceso directo a tus sesiones y clases.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={openCalendar}>
                Abrir calendario
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="min-h-[200px]" id="registro-antropometrico">
            <CardHeader>
              <CardTitle>Registro antropométrico</CardTitle>
              <CardDescription>Captura peso, perímetros y notas.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => document.getElementById('seguimiento-corporal')?.scrollIntoView({ behavior: 'smooth' })}>
                Abrir registro
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {trainer && <TrainerInfoCard trainer={trainer} />}
        <Card>
          <CardHeader>
            <CardTitle>Rutina y nutrición</CardTitle>
            <CardDescription>Accesos directos a tu plan actual.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {routine ? <AssignedRoutineCard routine={routine} onViewDetails={() => setViewingRoutine(routine)} /> : <div className="rounded-xl border p-6 text-sm text-muted-foreground">Sin rutina asignada</div>}
            {mealPlan ? <AssignedMealPlanCard mealPlan={mealPlan as never} onViewDetails={() => setViewingMealPlan(mealPlan)} /> : <div className="rounded-xl border p-6 text-sm text-muted-foreground">Sin plan alimenticio</div>}
          </CardContent>
        </Card>
      </section>

      <CreateRoutineDialog
        open={showCreateRoutine}
        onOpenChange={setShowCreateRoutine}
        onSuccess={handleRoutineCreated}
      />
    </div>
  )
}
