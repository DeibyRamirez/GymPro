"use client"

import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Loader2, LockKeyhole } from "lucide-react"
import { useState } from "react"

interface ChangePasswordFormProps {
  onSuccess?: () => void
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!currentPassword) {
      setError("Ingresa tu contraseña actual")
      return
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/users/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "No se pudo actualizar la contraseña")
        return
      }

      setSuccess(data.message || "Contraseña actualizada correctamente")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      onSuccess?.()
      setTimeout(() => setSuccess(""), 4000)
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-muted-foreground">
          Si olvidaste tu contraseña actual, cierra sesión y usa{" "}
          <strong>¿Olvidaste tu contraseña?</strong> en la pantalla de login.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="current-password">Contraseña actual</Label>
        <PasswordInput
          id="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-new-password">Nueva contraseña</Label>
          <PasswordInput
            id="profile-new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-confirm-password">Confirmar nueva contraseña</Label>
          <PasswordInput
            id="profile-confirm-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Actualizando...
          </>
        ) : (
          "Actualizar contraseña"
        )}
      </Button>
    </form>
  )
}
