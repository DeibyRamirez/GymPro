"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { AppHeader } from "@/components/layout/app-header"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { TrainerDashboard } from "@/components/trainer/trainer-dashboard"
import { ClientDashboard } from "@/components/client/client-dashboard"
import type { User } from "@/lib/auth"

/**
 * Página principal de la app que:
 * - intenta restaurar la sesión (`/api/auth/me`),
 * - muestra login/registro si no hay usuario,
 * - redirige al dashboard de superadmin,
 * - y renderiza el dashboard según el rol autenticado.
 *
 * También expone el flujo de logout, limpiando la sesión del backend y
 * redirigiendo al login del gimnasio cuando aplica.
 *
 * @remarks
 * Sobre `router` en el `useEffect`:
 * - **Sí es correcto incluirlo** en el arreglo de dependencias para cumplir con
 *   `react-hooks/exhaustive-deps`, porque se utiliza dentro del efecto.
 * - En Next.js (`next/navigation`) normalmente `router` es estable, así que
 *   incluirlo **no suele causar re-ejecuciones extra** relevantes.
 * - Si se busca ejecutar el efecto estrictamente una sola vez al montar, puede
 *   omitirse con criterio; aun así, mantenerlo en dependencias es la opción más
 *   segura y clara desde reglas de hooks.
 *
 * @returns La vista de carga, autenticación o dashboard correspondiente al estado de sesión.
 */
export default function AppPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [loadingSession, setLoadingSession] = useState(true)
  const [clientProfileRequest, setClientProfileRequest] = useState(0)

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await response.json()

        // Si el usuario es superadmin, redirige a su dashboard
        if (response.ok && data.user) {
          setCurrentUser(data.user)
          if (data.user.role === 'superadmin') {
            router.replace('/superadmin')
          }
        }
      } finally {
        setLoadingSession(false)
      }
    }

    loadSession()
  }, [router])

  const handleLogin = (user: User) => setCurrentUser(user)
  const handleRegister = (user: User) => setCurrentUser(user)
  
  // Maneja el logout, limpia la sesión y redirige al login del gimnasio si es necesario
  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    if (currentUser?.gymSlug) router.push(`/portal/${currentUser.gymSlug}/login`)
    setCurrentUser(null)
  }

  // Mientras se carga la sesión, muestra una pantalla de carga o un fondo vacío
  if (loadingSession) {
    return <div className="min-h-screen bg-background" />
  }

  // Si no hay usuario autenticado, muestra el formulario de login o registro
  if (!currentUser) {
    if (showRegister) {
      return <RegisterForm onRegister={handleRegister} onSwitchToLogin={() => setShowRegister(false)} />
    }

    return <LoginForm onLogin={handleLogin} onSwitchToRegister={() => setShowRegister(true)} />
  }

  
  return (
    // Renderiza el dashboard correspondiente según el rol del usuario
    <div className="min-h-screen bg-background">
      <AppHeader
        user={currentUser}
        onLogout={handleLogout}
        onProfileClick={
          currentUser.role === "client"
            ? () => setClientProfileRequest((count) => count + 1)
            : undefined
        }
        onSettingsClick={() => router.push("/app/account")}
      />
      <main className="w-full max-w-[1800px] mx-auto px-4 py-6 lg:px-6 2xl:px-8">
        {currentUser.role === 'admin' && <AdminDashboard />}
        {currentUser.role === 'trainer' && <TrainerDashboard trainerId={currentUser.id} />}
        {currentUser.role === 'client' && (
          <ClientDashboard client={currentUser} profileRequest={clientProfileRequest} />
        )}
      </main>
    </div>
  )
}
