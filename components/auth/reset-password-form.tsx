"use client"

import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Loader2, LockKeyhole } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface ResetPasswordFormProps {
  token: string
  loginHref: string
}

export function ResetPasswordForm({ token, loginHref }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setTokenValid(Boolean(data.valid))
      })
      .catch(() => {
        if (!cancelled) setTokenValid(false)
      })
      .finally(() => {
        if (!cancelled) setValidating(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "No se pudo restablecer la contraseña")
        return
      }

      setSuccess(data.message || "Contraseña actualizada correctamente")
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="flex min-h-[220px] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">
          Este enlace expiró o ya no es válido. Solicita uno nuevo desde la pantalla de inicio de sesión.
        </p>
        <Button asChild className="w-full">
          <Link href={loginHref}>Volver al inicio de sesión</Link>
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-emerald-600">{success}</p>
        <Button asChild className="w-full">
          <Link href={loginHref}>Ir a iniciar sesión</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">Nueva contraseña</h3>
        <p className="text-sm text-muted-foreground">
          Elige una contraseña segura de al menos 6 caracteres.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">Nueva contraseña</Label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar contraseña</Label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Guardando..." : "Actualizar contraseña"}
        </Button>
      </form>
    </div>
  )
}
