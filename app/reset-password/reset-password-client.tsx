"use client"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function ResetPasswordPageClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Dumbbell className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Restablecer contraseña</CardTitle>
            <CardDescription>Completa el paso final del proceso de recuperación</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {token ? (
            <ResetPasswordForm token={token} loginHref="/app" />
          ) : (
            <p className="text-center text-sm text-destructive">
              Falta el token de recuperación. Abre el enlace que recibiste por correo.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
