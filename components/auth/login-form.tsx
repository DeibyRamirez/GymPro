"use client"

import type React from "react"

import { ForgotPasswordSentStep, ForgotPasswordStep } from "@/components/auth/forgot-password-steps"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import type { User } from "@/lib/auth"
import { Dumbbell } from "lucide-react"
import { useEffect, useState } from "react"

interface LoginFormProps {
  onLogin: (user: User) => void
  onSwitchToRegister?: () => void
  redirectTo?: string
  gymSlug?: string
}

type AuthStep = "login" | "forgot" | "forgot-sent"

const PLACEHOLDER_LOGO = "/placeholder-logo.svg"

function hasCustomLogo(logo?: string | null) {
  return Boolean(logo && logo !== PLACEHOLDER_LOGO)
}

export function LoginForm({ onLogin, onSwitchToRegister, redirectTo = '/app', gymSlug }: LoginFormProps) {
  const [step, setStep] = useState<AuthStep>("login")
  const [forgotEmail, setForgotEmail] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [gymBranding, setGymBranding] = useState<{ name: string; logo: string | null } | null>(null)

  useEffect(() => {
    if (!gymSlug) return

    const slug = gymSlug
    let active = true

    async function loadGymBranding() {
      try {
        const response = await fetch(`/api/gyms/${slug}`)
        if (!active) return

        if (!response.ok) {
          setGymBranding({ name: slug, logo: null })
          return
        }

        const data = await response.json()
        setGymBranding({
          name: data.gym?.name || slug,
          logo: data.gym?.logo || null,
        })
      } catch {
        if (active) {
          setGymBranding({ name: slug, logo: null })
        }
      }
    }

    void loadGymBranding()

    return () => {
      active = false
    }
  }, [gymSlug])

  const displayName = gymSlug ? (gymBranding?.name ?? gymSlug) : "GymPro"
  const displayLogo = gymSlug ? gymBranding?.logo ?? null : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Correo electrónico y contraseña son requeridos")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          gymSlug,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al iniciar sesión")
        setLoading(false)
        return
      }

      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar,
        trainerId: data.user.trainerId,
        gymId: data.user.gymId,
        gymSlug: data.user.gymSlug,
      }

      onLogin(user)
      window.location.assign(user.role === 'superadmin' ? '/superadmin' : redirectTo)
    } catch {
      setError("Error de conexión. Por favor intenta de nuevo.")
      setLoading(false)
    }
  }

  const resetToLogin = () => {
    setStep("login")
    setError("")
  }

  return (
    <div className="max-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border bg-primary/10">
            {hasCustomLogo(displayLogo) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayLogo!}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <Dumbbell className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-balance">
              {step === "login" ? displayName : "Recuperación"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {step === "login"
                ? gymSlug
                  ? `Acceso al portal de ${displayName}`
                  : "Acceso al SaaS de gestión de gimnasios"
                : "Recupera tu contraseña sin intervención del administrador"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {step === "login" && (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">Contraseña</Label>
                    <button
                      type="button"
                      onClick={() => setStep("forgot")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>

              {onSwitchToRegister && (
                <div className="mt-6 text-center text-sm">
                  <p className="text-muted-foreground">
                    ¿No tienes una cuenta?{" "}
                    <button
                      type="button"
                      onClick={onSwitchToRegister}
                      className="text-primary hover:underline font-medium"
                    >
                      Regístrate
                    </button>
                  </p>
                </div>
              )}
            </>
          )}

          {step === "forgot" && (
            <ForgotPasswordStep
              gymSlug={gymSlug}
              onBack={resetToLogin}
              onSent={(sentEmail) => {
                setForgotEmail(sentEmail)
                setStep("forgot-sent")
              }}
            />
          )}

          {step === "forgot-sent" && (
            <ForgotPasswordSentStep email={forgotEmail} onBack={resetToLogin} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
