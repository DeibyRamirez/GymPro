"use client"

import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Shield, User } from "lucide-react"
import { useEffect, useState } from "react"

export function TrainerProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await fetch("/api/users/profile", { credentials: "include" })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Error al cargar perfil")
        }

        setName(data.user?.name || "")
        setEmail(data.user?.email || "")
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error al cargar perfil")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    if (!name.trim()) {
      setError("El nombre es requerido")
      setSaving(false)
      return
    }

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar perfil")
      }

      setSuccess("Perfil actualizado exitosamente")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al actualizar perfil")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Mi Perfil</CardTitle>
          </div>
          <CardDescription>Actualiza tu información personal como entrenador</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trainer-name">Nombre completo</Label>
              <Input
                id="trainer-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainer-email">Correo electrónico</Label>
              <Input id="trainer-email" type="email" value={email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">El correo electrónico no se puede cambiar</p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">{success}</p> : null}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Seguridad</CardTitle>
          </div>
          <CardDescription>Cambia tu contraseña cuando lo necesites</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
