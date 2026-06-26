"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ClientCard } from "./client-card"
import {
  AssignProgramDialog,
  type AssignProgramPayload,
  type ExistingAssignmentForEdit,
} from "./assign-program-dialog"
import { Input } from "@/components/ui/input"
import { Search, Users, Filter } from "lucide-react"
import type { User } from "@/lib/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { getDocumentId } from "@/lib/assignment/ref-id"

interface ClientsViewProps {
  trainerId: string
}

type TrainerAssignment = ExistingAssignmentForEdit & {
  id?: string
  clientId?: { _id?: string; id?: string } | string
  routineId?: { _id?: string; id?: string; sourceRoutineId?: string } | string
  mealPlanId?: unknown
  status?: string
}

export function ClientsView({ trainerId }: ClientsViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<(User & { goal?: string | null }) | null>(null)
  const [programDialogOpen, setProgramDialogOpen] = useState(false)
  const [clients, setClients] = useState<(User & { gymSlug?: string | null; goal?: string | null })[]>([])
  const [assignments, setAssignments] = useState<TrainerAssignment[]>([])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const [clientsRes, assignmentsRes] = await Promise.all([
          fetch(`/api/users?role=client&trainerId=${trainerId}`, { credentials: "include" }),
          fetch(`/api/assignments?trainerId=${trainerId}`, { credentials: "include" }),
        ])

        const clientsData = await clientsRes.json().catch(() => null)
        const assignmentsData = await assignmentsRes.json().catch(() => null)

        if (!clientsRes.ok) {
          throw new Error(clientsData?.error || "No se pudieron cargar los clientes")
        }

        if (!assignmentsRes.ok) {
          throw new Error(assignmentsData?.error || "No se pudieron cargar las asignaciones")
        }

        if (mounted) {
          setClients(clientsData?.users || [])
          setAssignments(assignmentsData?.assignments || [])
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudieron cargar los datos del panel"
        toast({
          title: "Error al cargar clientes",
          description: message,
          variant: "destructive",
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
    const assignmentsRes = await fetch(`/api/assignments?trainerId=${trainerId}`, { credentials: "include" })
    const assignmentsData = await assignmentsRes.json().catch(() => null)

    if (!assignmentsRes.ok) {
      throw new Error(assignmentsData?.error || "No se pudieron refrescar las asignaciones")
    }

    setAssignments(assignmentsData?.assignments || [])
  }

  const getAssignmentClientId = (clientId?: { _id?: string; id?: string } | string) => {
    if (typeof clientId === "string") return clientId
    return String(clientId?._id || clientId?.id || "")
  }

  const getAssignmentRecordId = (assignment?: TrainerAssignment | null) =>
    getDocumentId(assignment) || assignment?._id || assignment?.id || null

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())

    if (filterStatus === "all") return matchesSearch

    const assignment = getClientAssignment(client.id)
    if (filterStatus === "active") return matchesSearch && assignment
    if (filterStatus === "inactive") return matchesSearch && !assignment

    return matchesSearch
  })

  const handleAssignProgram = (client: User & { goal?: string | null }) => {
    setSelectedClient(client)
    setProgramDialogOpen(true)
  }

  const handleProgramAssigned = async (payload: AssignProgramPayload) => {
    if (!selectedClient) return

    const existing = getClientAssignment(selectedClient.id)
    const existingId = getAssignmentRecordId(existing)
    const isUpdate = Boolean(existingId && existing?.status !== "cancelled" && existing?.status !== "completed")

    const body = {
      routineId: payload.routineId,
      mealPlanId: payload.mealPlanId,
      durationWeeks: payload.durationWeeks,
      weeklySchedule: payload.weeklySchedule,
      ...(isUpdate ? {} : { clientId: selectedClient.id, trainerId, startDate: new Date().toISOString() }),
    }

    let didUpdate = isUpdate

    let res = await fetch(
      isUpdate ? `/api/assignments/${existingId}/program` : "/api/assignments",
      {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      },
    )

    let data = await res.json().catch(() => null)

    if (!res.ok && res.status === 409 && data?.assignmentId) {
      didUpdate = true
      res = await fetch(`/api/assignments/${data.assignmentId}/program`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
      data = await res.json().catch(() => null)
    }

    if (!res.ok) {
      throw new Error(data?.error || (isUpdate ? "No se pudo actualizar el programa" : "No se pudo asignar el programa"))
    }

    toast({
      title: didUpdate ? "Programa actualizado" : "Programa asignado",
      description: didUpdate
        ? `El programa de ${selectedClient.name} fue actualizado.`
        : `Se asignó el programa a ${selectedClient.name}.`,
    })

    await refreshAssignments()
  }

  const getClientAssignment = (clientId: string) => {
    return assignments.find((a) => {
      const matchesClient = getAssignmentClientId(a.clientId) === clientId
      const status = a.status || "active"
      return matchesClient && !["cancelled", "completed"].includes(status)
    })
  }

  const selectedAssignment = selectedClient ? getClientAssignment(selectedClient.id) : null

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
                hasActiveProgram={!!assignment}
                onAssignProgram={() => handleAssignProgram(client)}
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
        <AssignProgramDialog
          open={programDialogOpen}
          onOpenChange={setProgramDialogOpen}
          clientName={selectedClient.name}
          clientGoal={selectedClient.goal}
          existingAssignment={selectedAssignment || null}
          onAssign={handleProgramAssigned}
        />
      )}
    </div>
  )
}
