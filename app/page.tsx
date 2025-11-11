"use client"

import { useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { AppHeader } from "@/components/layout/app-header"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { TrainerDashboard } from "@/components/trainer/trainer-dashboard"
import { ClientDashboard } from "@/components/client/client-dashboard"
import type { User } from "@/lib/auth"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showRegister, setShowRegister] = useState(false)

  const handleLogin = (user: User) => {
    setCurrentUser(user)
  }

  const handleRegister = (user: User) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    // Limpiar cookie de autenticación
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  if (!currentUser) {
    if (showRegister) {
      return (
        <RegisterForm
          onRegister={handleRegister}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      )
    }
    return (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={currentUser} onLogout={handleLogout} />
      <main className="container py-6 px-4">
        {currentUser.role === "admin" && <AdminDashboard />}
        {currentUser.role === "trainer" && <TrainerDashboard trainerId={currentUser.id} />}
        {currentUser.role === "client" && <ClientDashboard client={currentUser} />}
      </main>
    </div>
  )
}
