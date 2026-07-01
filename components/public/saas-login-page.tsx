"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Dumbbell,
  Shield,
  Sparkles,
  Users,
} from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Users,
    title: "Roles unificados",
    description: "Admin, entrenador y cliente entran con la misma puerta y van a su dashboard.",
  },
  {
    icon: BarChart3,
    title: "Progreso en tiempo real",
    description: "Rutinas, planes alimenticios, logros y mensajes con tu entrenador.",
  },
  {
    icon: Shield,
    title: "Acceso seguro",
    description: "Sesión protegida y recuperación de contraseña sin depender del administrador.",
  },
] as const

export function SaasLoginPage() {
  const router = useRouter()

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.18),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/register">Registrar gimnasio</Link>
          </Button>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-16">
          <section className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                Acceso Gym Pro
              </Badge>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-primary/10 shadow-sm">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Plataforma SaaS para gimnasios</p>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Gestiona tu gimnasio desde un solo lugar
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                Inicia sesión para entrar al panel de administración, la vista de entrenador o el portal del cliente.
                Cada rol llega automáticamente a su espacio de trabajo.
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
              {features.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="group flex gap-4 rounded-2xl border bg-card/60 p-4 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card/90"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold leading-tight">{title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
                <Link href="/register">
                  ¿Aún no tienes gimnasio?
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-3xl border bg-card/95 shadow-2xl shadow-primary/5 backdrop-blur-sm">
              <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-accent" />
              <div className="p-6 sm:p-8">
                <LoginForm
                  embedded
                  onLogin={() => router.push("/app")}
                  onSwitchToRegister={() => router.push("/register")}
                  redirectTo="/app"
                />
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              ¿Eres cliente de un gimnasio específico? Usa el enlace de acceso que te compartió tu centro.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
