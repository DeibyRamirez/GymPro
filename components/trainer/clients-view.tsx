"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ClientCard } from "./client-card"
import { AssignRoutineDialog } from "./assign-routine-dialog"
import { AssignMealPlanDialog } from "./assign-meal-plan-dialog"
import { Input } from "@/components/ui/input"
import { Search, Users, Filter } from "lucide-react"
import type { User } from "@/lib/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

interface ClientsViewProps {
  trainerId: string
}

export function ClientsView({ trainerId }: ClientsViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<User | null>(null)
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false)
  const [mealPlanDialogOpen, setMealPlanDialogOpen] = useState(false)
  const [clients, setClients] = useState<(User & { gymSlug?: string | null })[]>([])
  const [assignments, setAssignments] = useState<Array<{ clientId?: { _id?: string; id?: string } | string; routineId?: string; mealPlanId?: string }>>([])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const [clientsRes, assignmentsRes] = await Promise.all([
          fetch(`/api/users?role=client&trainerId=${trainerId}`, { credentials: 'include' }),
          fetch(`/api/assignments?trainerId=${trainerId}`, { credentials: 'include' }),
        ])

        const clientsData = await clientsRes.json().catch(() => null)
        const assignmentsData = await assignmentsRes.json().catch(() => null)

        if (!clientsRes.ok) {
          throw new Error(clientsData?.error || 'No se pudieron cargar los clientes')
        }

        if (!assignmentsRes.ok) {
          throw new Error(assignmentsData?.error || 'No se pudieron cargar las asignaciones')
        }

        if (mounted) {
          setClients(clientsData?.users || [])
          setAssignments(assignmentsData?.assignments || [])
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudieron cargar los datos del panel'
        toast({
          title: 'Error al cargar clientes',
          description: message,
          variant: 'destructive',
        })
      }
    }

    load()
    const interval = window.setInterval(load, 15000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [trainerId])

  const refreshAssignments = async () => {
    const assignmentsRes = await fetch(`/api/assignments?trainerId=${trainerId}`, { credentials: 'include' })
    const assignmentsData = await assignmentsRes.json().catch(() => null)

    if (!assignmentsRes.ok) {
      throw new Error(assignmentsData?.error || 'No se pudieron refrescar las asignaciones')
    }

    setAssignments(assignmentsData?.assignments || [])
  }

  const getAssignmentClientId = (clientId?: { _id?: string; id?: string } | string) => {
    if (typeof clientId === "string") return clientId
    return clientId?._id || clientId?.id
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())

    if (filterStatus === "all") return matchesSearch

    const assignment = assignments.find((a) => getAssignmentClientId(a.clientId) === client.id)
    if (filterStatus === "active") return matchesSearch && assignment
    if (filterStatus === "inactive") return matchesSearch && !assignment

    return matchesSearch
  })

  const handleAssignRoutine = (client: User) => {
    setSelectedClient(client)
    setRoutineDialogOpen(true)
  }

  const handleAssignMealPlan = (client: User) => {
    setSelectedClient(client)
    setMealPlanDialogOpen(true)
  }

  const handleRoutineAssigned = async (payload: { routineId: string; durationWeeks: number; weeklySchedule: Array<{ dayOfWeek: number; isRestDay: boolean; title?: string }> }) => {
    if (!selectedClient) return

    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        clientId: selectedClient.id,
        trainerId,
        routineId: payload.routineId,
        startDate: new Date().toISOString(),
        durationWeeks: payload.durationWeeks,
        weeklySchedule: payload.weeklySchedule,
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      throw new Error(data?.error || 'No se pudo asignar la rutina')
    }

    await refreshAssignments()
  }

  const handleMealPlanAssigned = async (mealPlanId: string) => {
    if (!selectedClient) return

    const currentAssignment = getClientAssignment(selectedClient.id)
    const assignmentId =
      typeof currentAssignment === "object" && currentAssignment
        ? (currentAssignment as { id?: string; _id?: string }).id || (currentAssignment as { id?: string; _id?: string })._id
        : undefined

    if (!assignmentId) {
      throw new Error('No existe una asignación activa para este cliente. Primero asigna una rutina.')
    }

    const res = await fetch(`/api/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mealPlanId }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      throw new Error(data?.error || 'No se pudo asignar el plan alimenticio')
    }

    await refreshAssignments()
  }

  const getClientAssignment = (clientId: string) => {
    return assignments.find((a) => getAssignmentClientId(a.clientId) === clientId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              <SelectItem value="active">Con plan activo</SelectItem>
              <SelectItem value="inactive">Sin plan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
          <Users className="h-4 w-4" />
          <span>{filteredClients.length} clientes</span>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron clientes</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Intenta con otros términos de búsqueda" : "Aún no tienes clientes asignados"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const assignment = getClientAssignment(client.id)
            return (
              <ClientCard
                key={client.id}
                client={client}
                hasRoutine={!!assignment?.routineId}
                hasMealPlan={!!assignment?.mealPlanId}
                onAssignRoutine={() => handleAssignRoutine(client)}
                onAssignMealPlan={() => handleAssignMealPlan(client)}
                onViewDetails={() => {
                  if (!client.gymSlug) return
                  router.push(`/portal/${client.gymSlug}/clients/${client.id}`)
                }}
              />
            )
          })}
        </div>
      )}

      {selectedClient && (
        <>
          <AssignRoutineDialog
            open={routineDialogOpen}
            onOpenChange={setRoutineDialogOpen}
            clientName={selectedClient.name}
            onAssign={handleRoutineAssigned}
          />
          <AssignMealPlanDialog
            open={mealPlanDialogOpen}
            onOpenChange={setMealPlanDialogOpen}
            clientName={selectedClient.name}
            onAssign={handleMealPlanAssigned}
          />
        </>
      )}
    </div>
  )
}
