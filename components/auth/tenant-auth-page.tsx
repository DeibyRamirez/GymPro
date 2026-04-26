"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TenantAuthPageProps {
  mode: "login" | "register"
  gymSlug?: string
}

export function TenantAuthPage({ mode, gymSlug }: TenantAuthPageProps) {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const [gymName, setGymName] = useState<string>('Gym Pro')

  useEffect(() => {
    const loadGym = async () => {
      if (!params.slug) return
      const response = await fetch(`/api/gyms/${params.slug}`)
      if (response.ok) {
        const data = await response.json()
        setGymName(data.gym?.name || 'Gym Pro')
      }
    }

    loadGym()
  }, [params.slug])

  // Este wrapper conecta los formularios existentes con el nuevo flujo por gimnasio.
  const handleSuccess = () => {
    router.push('/app')
  }

  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <div className="mx-auto max-w-md py-8">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Ingresar a {gymName}</CardTitle>
              <CardDescription>Autenticación del tenant actual.</CardDescription>
            </CardHeader>
          </Card>
          <LoginForm onLogin={handleSuccess} onSwitchToRegister={() => router.push(`/portal/${params.slug}/register`)} gymSlug={gymSlug || params.slug} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="mx-auto max-w-md py-8">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Registrarse en {gymName}</CardTitle>
            <CardDescription>El alta queda asociada al gimnasio del subdominio.</CardDescription>
          </CardHeader>
        </Card>
        <RegisterForm onRegister={handleSuccess} onSwitchToLogin={() => router.push(`/portal/${params.slug}/login`)} gymSlug={gymSlug || params.slug} />
      </div>
    </div>
  )
}
