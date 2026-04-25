"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Shield, Dumbbell, Crown } from "lucide-react"
import type { UserRole } from "@/lib/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UsersTableProps {
  users: Array<{ id: string; name: string; email: string; role: UserRole; avatar?: string; trainerId?: string; isActive?: boolean }>
  onRefresh?: () => void
}

type TrainerOption = { id: string; name: string; email: string }

const roleIcons: Record<UserRole, typeof Shield> = {
  superadmin: Crown,
  admin: Shield,
  trainer: Dumbbell,
  client: Shield,
}

const roleLabels: Record<UserRole, string> = {
  superadmin: "Super Administrador",
  admin: "Administrador",
  trainer: "Entrenador",
  client: "Cliente",
}

const roleColors: Record<UserRole, string> = {
  superadmin: "bg-violet-500/10 text-violet-700",
  admin: "bg-destructive/10 text-destructive",
  trainer: "bg-primary/10 text-primary",
  client: "bg-accent/10 text-accent",
}

export function UsersTable({ users, onRefresh }: UsersTableProps) {
  const [trainers, setTrainers] = useState<TrainerOption[]>([])
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null)
  const [selectedTrainerByUser, setSelectedTrainerByUser] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadTrainers = async () => {
      const res = await fetch('/api/users?role=trainer', { credentials: 'include' })
      const data = await res.json()
      setTrainers((data.users || []).map((user: TrainerOption & { id?: string }) => ({ id: user.id, name: user.name, email: user.email })))
    }

    loadTrainers()
  }, [])

  const handleUpdateUser = async (userId: string, payload: Record<string, unknown>) => {
    setAssigningUserId(userId)
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    setAssigningUserId(null)
    if (response.ok) {
      onRefresh?.()
    }
  }

  const handleDeactivate = async (userId: string) => {
    await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    onRefresh?.()
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: { id: string; name: string; email: string; role: UserRole; avatar?: string; trainerId?: string; isActive?: boolean }) => {
            const RoleIcon = roleIcons[user.role]
            const assignedTrainer = trainers.find((trainer) => trainer.id === user.trainerId)
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium leading-none">{user.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">ID: {user.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={roleColors[user.role]}>
                    <RoleIcon className="mr-1 h-3 w-3" />
                    {roleLabels[user.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Badge variant="outline" className={user.isActive === false ? "bg-muted text-muted-foreground" : "bg-primary/5 text-primary border-primary/20"}>
                      {user.isActive === false ? "Inactivo" : "Activo"}
                    </Badge>
                    {user.role === 'client' && (
                      <div className="space-y-1">
                        <Select
                          value={selectedTrainerByUser[user.id] ?? user.trainerId ?? "unassigned"}
                          onValueChange={(value) => setSelectedTrainerByUser((current) => ({ ...current, [user.id]: value }))}
                        >
                          <SelectTrigger className="h-8 w-[220px]">
                            <SelectValue placeholder="Asignar entrenador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Sin entrenador</SelectItem>
                            {trainers.map((trainer) => (
                              <SelectItem key={trainer.id} value={trainer.id}>
                                {trainer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-muted-foreground">
                          {assignedTrainer ? `Actual: ${assignedTrainer.name}` : "Sin entrenador asignado"}
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                        {user.role === 'client' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateUser(user.id, { trainerId: selectedTrainerByUser[user.id] === 'unassigned' ? null : (selectedTrainerByUser[user.id] || user.trainerId || null) })}
                        disabled={assigningUserId === user.id}
                      >
                        Guardar asignación
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { role: 'superadmin', trainerId: null })}>Cambiar a superadmin</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { role: 'admin', trainerId: null })}>Cambiar a administrador</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { role: 'trainer' })}>Cambiar a entrenador</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { role: 'client' })}>Cambiar a cliente</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeactivate(user.id)}>Desactivar usuario</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
