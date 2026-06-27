"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/auth"
import { Dumbbell, LogOut, Settings, UserIcon } from "lucide-react"
import { NotificationBell } from "@/components/layout/notification-bell"

interface AppHeaderProps {
  user: User
  onLogout: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
}

export function AppHeader({ user, onLogout, onProfileClick, onSettingsClick }: AppHeaderProps) {
  const roleLabels: Record<User["role"], string> = {
    superadmin: "Super Administrador",
    admin: "Administrador",
    trainer: "Entrenador",
    client: "Cliente",
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/85 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex h-20 w-full max-w-[1800px] items-center justify-between px-6 lg:px-8 2xl:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-500 shadow-sm ring-1 ring-primary/15">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold leading-none tracking-tight">{user.gymName || 'FitPro Manager'}</h1>
              {user.gymName && (
                <span className="rounded-full border bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Live
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{user.gymName ? roleLabels[user.role] : 'SaaS Platform'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative mr-2 h-11 w-11 rounded-full p-0 text-foreground ring-1 ring-border/60 transition hover:bg-muted/70 hover:text-foreground hover:ring-primary/30 lg:mr-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" sideOffset={10}>
            <DropdownMenuLabel className="pb-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onProfileClick?.()}
              className="gap-3 py-2.5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserIcon className="h-4 w-4 shrink-0" />
              </span>
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSettingsClick?.()}
              className="py-2.5"
            >
              <Settings className="mr-3 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onLogout()
              }}
              className="py-2.5 text-destructive"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
