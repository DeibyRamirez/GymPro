"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Shield, Dumbbell } from "lucide-react"
import type { UserRole } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UsersTableProps {
  users: any[]
}

const roleIcons: Record<UserRole, typeof Shield> = {
  admin: Shield,
  trainer: Dumbbell,
  client: Shield,
}

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  trainer: "Entrenador",
  client: "Cliente",
}

const roleColors: Record<UserRole, string> = {
  admin: "bg-destructive/10 text-destructive",
  trainer: "bg-primary/10 text-primary",
  client: "bg-accent/10 text-accent",
}

export function UsersTable({ users }: UsersTableProps) {
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
          {users.map((user: { id: string; name: string; email: string; role: UserRole; avatar?: string }) => {
            const RoleIcon = roleIcons[user.role]
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
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    Activo
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                      <DropdownMenuItem>Editar usuario</DropdownMenuItem>
                      <DropdownMenuItem>Cambiar rol</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Desactivar usuario</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
