"use client"

import { useState } from "react"
import { ClientCard } from "./client-card"
import { AssignRoutineDialog } from "./assign-routine-dialog"
import { AssignMealPlanDialog } from "./assign-meal-plan-dialog"
import { Input } from "@/components/ui/input"
import { Search, Users, Filter } from "lucide-react"
import { getTrainerClients } from "@/lib/auth"
import { mockAssignments } from "@/lib/data"
import type { User } from "@/lib/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ClientsViewProps {
  trainerId: string
}

export function ClientsView({ trainerId }: ClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<User | null>(null)
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false)
  const [mealPlanDialogOpen, setMealPlanDialogOpen] = useState(false)

  const clients = getTrainerClients(trainerId)

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())

    if (filterStatus === "all") return matchesSearch

    const assignment = mockAssignments.find((a) => a.clientId === client.id)
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

  const handleRoutineAssigned = (routineId: string) => {
    console.log(`Rutina ${routineId} asignada a cliente ${selectedClient?.id}`)
  }

  const handleMealPlanAssigned = (mealPlanId: string) => {
    console.log(`Plan ${mealPlanId} asignado a cliente ${selectedClient?.id}`)
  }

  const getClientAssignment = (clientId: string) => {
    return mockAssignments.find((a) => a.clientId === clientId)
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
                onViewDetails={() => console.log("Ver detalles", client.id)}
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
