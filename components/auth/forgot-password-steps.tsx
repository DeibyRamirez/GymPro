"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail } from "lucide-react"
import { useState } from "react"

interface ForgotPasswordStepProps {
  gymSlug?: string
  onBack: () => void
  onSent: (email: string) => void
}

export function ForgotPasswordStep({ gymSlug, onBack, onSent }: ForgotPasswordStepProps) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Ingresa tu correo electrónico")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          ...(gymSlug ? { gymSlug } : {}),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "No se pudo enviar la solicitud")
        return
      }

      onSent(email.trim())
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">Recuperar contraseña</h3>
        <p className="text-sm text-muted-foreground">
          Paso 1 de 2 — Te enviaremos un enlace a tu correo para crear una nueva contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="forgot-email">Correo electrónico</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Enviando..." : "Enviar enlace de recuperación"}
        </Button>
      </form>

      <Button type="button" variant="ghost" className="w-full gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio de sesión
      </Button>
    </div>
  )
}

interface ForgotPasswordSentStepProps {
  email: string
  onBack: () => void
}

export function ForgotPasswordSentStep({ email, onBack }: ForgotPasswordSentStepProps) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
        <Mail className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Revisa tu correo</h3>
        <p className="text-sm text-muted-foreground">
          Paso 2 de 2 — Si <strong>{email}</strong> está registrado, recibirás un enlace válido por 1 hora.
        </p>
        <p className="text-sm text-muted-foreground">
          Abre el enlace del correo y define tu nueva contraseña. Luego vuelve aquí para iniciar sesión.
        </p>
      </div>
      <Button type="button" variant="outline" className="w-full gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio de sesión
      </Button>
    </div>
  )
}
