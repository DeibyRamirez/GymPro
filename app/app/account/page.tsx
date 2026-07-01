"use client"

import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { AppHeader } from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/lib/auth"
import { ArrowLeft, Loader2, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
        } else {
          router.replace("/app")
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.replace(user?.gymSlug ? `/portal/${user.gymSlug}/login` : "/app")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        user={user}
        onLogout={handleLogout}
        onProfileClick={
          ["client", "admin", "trainer"].includes(user.role)
            ? () => router.push("/app")
            : undefined
        }
        onSettingsClick={() => router.push("/app/account")}
      />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 lg:px-6">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad de la cuenta
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña sin necesidad de contactar al administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
