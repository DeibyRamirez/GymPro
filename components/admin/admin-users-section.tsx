"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UsersTable } from "@/components/admin/users-table"
import { DashboardSectionShell } from "@/components/dashboard/dashboard-section-shell"
import type { User } from "@/lib/auth"
import { Users } from "lucide-react"

interface AdminUsersSectionProps {
  users: Array<User & { trainerId?: string; isActive?: boolean }>
  onRefresh: () => Promise<void>
  onBack: () => void
}

export function AdminUsersSection({ users, onRefresh, onBack }: AdminUsersSectionProps) {
  return (
    <DashboardSectionShell
      title="Usuarios y clientes"
      description="Administra roles, permisos y el estado de las cuentas del gimnasio."
      onBack={onBack}
    >
      <Card className="rounded-3xl border bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gestión de usuarios
          </CardTitle>
          <CardDescription>
            Entrenadores, clientes y administradores en un solo lugar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} onRefresh={onRefresh} />
        </CardContent>
      </Card>
    </DashboardSectionShell>
  )
}
