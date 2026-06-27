"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Sparkles } from "lucide-react"

export function GymOnboardingPage() {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [slug, setSlug] = useState("")
  const [email, setEmail] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [plan, setPlan] = useState("starter")
  const [description, setDescription] = useState("")
  const [hours, setHours] = useState("Lun a Vie 6:00 - 22:00")
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [createdSlug, setCreatedSlug] = useState("")

  const autoSlug = useMemo(() => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }, [name])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      // Creamos el gimnasio real para poder probar el portal público y el acceso del SaaS.
      const response = await fetch('/api/gyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          location,
          slug: slug || autoSlug,
          email,
          adminEmail,
          adminPassword,
          phone,
          hours,
          description,
          status: 'active',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedSlug(data.gym?.slug || slug || autoSlug)
        setSubmitted(true)
      } else {
        const data = await response.json().catch(() => null)
        setError(data?.error || 'No se pudo crear el gimnasio')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-start">
        <div className="space-y-4 pt-4">
          <Badge variant="outline" className="gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Alta de gimnasio
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-balance sm:text-5xl">Crea tu gimnasio dentro de Gym Pro</h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Registra el nombre, la ubicación y los datos de contacto para preparar tu tenant. Después conectaremos el alta al backend multi-tenant.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulario de inscripción</CardTitle>
            <CardDescription>Completa los datos base del gimnasio.</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Solicitud preparada
                </p>
                <p>Tu gimnasio quedó listo para el siguiente paso de implementación.</p>

                <Button asChild className="w-full">
                  <Link href={`/portal/${createdSlug || slug || autoSlug}/home`}>Ir al portal de mi gimnasio</Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del gimnasio</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Power House Gym" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Madrid, España" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Subdominio sugerido</Label>
                  <Input id="slug" value={slug || autoSlug} onChange={(e) => setSlug(e.target.value)} placeholder={autoSlug || 'mi-gimnasio'} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo de contacto</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@tugym.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Correo del admin</Label>
                  <Input id="adminEmail" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@tugym.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Contraseña del admin</Label>
                  <PasswordInput id="adminPassword" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan SaaS</Label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger id="plan">
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción breve</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe tu gimnasio y su propuesta de valor" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Horario</Label>
                  <Input id="hours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Lun a Vie 6:00 - 22:00" />
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Creando...' : 'Crear gimnasio'}</Button>
              </form>
            )}
            <div className="pt-2">
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Volver a iniciar sesión</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
