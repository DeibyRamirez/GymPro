"use client"

import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudinaryImageUpload } from "@/components/ui/cloudinary-image-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Shield, Store, User } from "lucide-react"
import { useEffect, useState } from "react"

interface AdminProfileProps {
  gymSlug: string
}

export function AdminProfile({ gymSlug }: AdminProfileProps) {
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingBranding, setSavingBranding] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [brandingError, setBrandingError] = useState("")
  const [brandingSuccess, setBrandingSuccess] = useState("")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [gymName, setGymName] = useState("")
  const [gymLogo, setGymLogo] = useState<string[]>([])
  const [gymCover, setGymCover] = useState<string[]>([])

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError("")

      try {
        const requests = [
          fetch("/api/users/profile", { credentials: "include" }),
        ]

        if (gymSlug) {
          requests.push(fetch(`/api/gyms/${gymSlug}`, { credentials: "include" }))
        }

        const [profileRes, gymRes] = await Promise.all(requests)
        const profileData = await profileRes.json()

        if (!profileRes.ok) {
          throw new Error(profileData.error || "Error al cargar perfil")
        }

        setName(profileData.user?.name || "")
        setEmail(profileData.user?.email || "")

        if (gymRes) {
          const gymData = await gymRes.json()
          if (gymRes.ok) {
            setGymName(gymData.gym?.name || "")
            setGymLogo(gymData.gym?.logo ? [gymData.gym.logo] : [])
            setGymCover(gymData.gym?.coverImage ? [gymData.gym.coverImage] : [])
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error al cargar perfil")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [gymSlug])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    setSavingProfile(true)

    if (!name.trim()) {
      setError("El nombre es requerido")
      setSavingProfile(false)
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
      setSavingProfile(false)
    }
  }

  const saveGymBranding = async () => {
    if (!gymSlug) {
      setBrandingError("No se encontró el gimnasio asociado a tu cuenta")
      return
    }

    setSavingBranding(true)
    setBrandingError("")
    setBrandingSuccess("")

    try {
      const response = await fetch("/api/gyms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slug: gymSlug,
          logo: gymLogo[0] || "/placeholder-logo.svg",
          coverImage: gymCover[0] || "/athletic-trainer.png",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar la identidad del gimnasio")
      }

      setBrandingSuccess("Identidad del gimnasio actualizada")
      setTimeout(() => setBrandingSuccess(""), 3000)
    } catch (err: unknown) {
      setBrandingError(err instanceof Error ? err.message : "Error al guardar la identidad del gimnasio")
    } finally {
      setSavingBranding(false)
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
          <CardDescription>Actualiza tu información personal de administrador</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Nombre completo</Label>
              <Input
                id="admin-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email">Correo electrónico</Label>
              <Input id="admin-email" type="email" value={email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">El correo electrónico no se puede cambiar</p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">{success}</p> : null}

            <Button type="submit" className="w-full" disabled={savingProfile}>
              {savingProfile ? (
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
            <Store className="h-5 w-5" />
            <CardTitle>Identidad del gimnasio</CardTitle>
          </div>
          <CardDescription>
            {gymName
              ? `Logo e imagen de portada de ${gymName}, visibles en el portal público.`
              : "Logo e imagen de portada visibles en el portal público del establecimiento."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <CloudinaryImageUpload
            label="Icono del gimnasio"
            value={gymLogo}
            onChange={setGymLogo}
            folder="gympro/gyms/logos"
            maxImages={1}
          />
          <CloudinaryImageUpload
            label="Banner de portada"
            value={gymCover}
            onChange={setGymCover}
            folder="gympro/gyms/covers"
            maxImages={1}
          />
          <div className="md:col-span-2 space-y-2">
            {brandingError ? <p className="text-sm text-destructive">{brandingError}</p> : null}
            {brandingSuccess ? <p className="text-sm text-green-600">{brandingSuccess}</p> : null}
            <Button onClick={saveGymBranding} disabled={savingBranding || !gymSlug}>
              {savingBranding ? "Guardando..." : "Guardar logo y portada"}
            </Button>
          </div>
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
