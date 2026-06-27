"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Routine } from "@/lib/data"
import { Clock, Dumbbell, Edit, Eye, Plus, Search, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { CreateRoutineDialog } from "./create-routine-dialog"
import { EditRoutineDialog } from "./edit-routine-dialog"
import { ViewRoutineDialog } from "./view-routine-dialog"

interface RoutinesLibraryProps {
  trainerId: string
}

async function fetchTemplateRoutines(): Promise<Routine[]> {
  const res = await fetch("/api/routines?templatesOnly=true", {
    method: "GET",
    credentials: "include",
  })

  if (!res.ok) throw new Error("Error al obtener rutinas")

  const data = await res.json()
  return data.routines || []
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RoutinesLibrary({ trainerId }: RoutinesLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null)
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // const filteredRoutines = mockRoutines.filter(
  //   (routine) =>
  //     routine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     routine.description.toLowerCase().includes(searchQuery.toLowerCase()),
  // )

  const filteredRoutines = routines.filter(
    (routine) =>
      routine.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      routine.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )


  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
      case "advanced":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "Principiante"
      case "intermediate":
        return "Intermedio"
      case "advanced":
        return "Avanzado"
      default:
        return difficulty
    }
  }


  useEffect(() => {
    async function loadRoutines() {
      try {
        setLoading(true)
        setError("")
        setRoutines(await fetchTemplateRoutines())
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    void loadRoutines()
  }, [])

  const refreshRoutines = async () => {
    setRoutines(await fetchTemplateRoutines())
  }

  if (loading) return <p>Cargando rutinas...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar rutinas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Nueva Rutina
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoutines.map((routine) => {
          const routineKey = routine.id || routine._id || routine.name
          return (
          <Card
            key={routineKey}
            className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
          >
            {/* Header de la tarjeta con gradiente */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border-b">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <Badge className={getDifficultyColor(routine.difficulty)}>
                  {getDifficultyLabel(routine.difficulty)}
                </Badge>
              </div>
              <h3 className="font-bold text-xl mb-2 text-balance">{routine.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 text-pretty">{routine.description}</p>
            </div>

            {/* Información de la rutina */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{routine.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>{routine.exercises.length} ejercicios</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 bg-transparent"
                  onClick={() => {
                    setSelectedRoutine(routine)
                    setViewDialogOpen(true)
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 bg-transparent"
                  onClick={() => {
                    setSelectedRoutine(routine)
                    setEditDialogOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>

              </div>
            </div>
          </Card>
        )})}
      </div>

      {/* Diálogos */}
      <CreateRoutineDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refreshRoutines}
      />
      {selectedRoutine && (
        <>
          <EditRoutineDialog
            key={selectedRoutine.id || selectedRoutine._id}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            routine={selectedRoutine}
            onUpdated={refreshRoutines}
          />
          <ViewRoutineDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen} routine={selectedRoutine} />
        </>
      )}
    </div>
  )
}
