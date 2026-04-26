"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export function SaasLoginPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-4">
          <Badge variant="outline">Acceso SaaS</Badge>
          <h1 className="text-4xl font-black tracking-tight text-balance sm:text-5xl">Inicia sesión en Gym Pro</h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Este acceso es para entrar al sistema central del SaaS. Después del login, el dashboard dirige cada rol a su vista correspondiente.
          </p>
          <Card>
            <CardHeader>
              <CardTitle>Qué puedes hacer aquí</CardTitle>
              <CardDescription>Acceso global para admin, trainer y client.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Administrar tu cuenta, entrar al dashboard y continuar al entorno del gimnasio asignado.
            </CardContent>
          </Card>
        </div>

        <LoginForm
          onLogin={() => router.push('/app')}
          onSwitchToRegister={() => router.push('/register')}
          redirectTo="/app"
        />
      </div>
    </main>
  )
}
