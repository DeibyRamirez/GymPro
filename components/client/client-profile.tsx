"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Save, Loader2 } from "lucide-react"

interface ClientProfileProps {
  clientId: string
  onUpdate?: () => void
}

export function ClientProfile({ clientId, onUpdate }: ClientProfileProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Datos del usuario
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [age, setAge] = useState("")
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [gender, setGender] = useState<"masculino" | "femenino" | "otro" | "">("")
  const [phone, setPhone] = useState("")
  const [goal, setGoal] = useState<"perder_peso" | "ganar_masa" | "mantenimiento" | "tonificar" | "resistencia" | "otro" | "">("")
  const [activityLevel, setActivityLevel] = useState<"principiante" | "intermedio" | "avanzado" | "">("")
  const [medicalConditions, setMedicalConditions] = useState("")

  // Cargar datos del usuario
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError("")
      
      try {
        const response = await fetch("/api/users/profile")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Error al cargar perfil")
        }

        const user = data.user
        setName(user.name || "")
        setEmail(user.email || "")
        setAge(user.age?.toString() || "")
        setWeight(user.weight?.toString() || "")
        setHeight(user.height?.toString() || "")
        setGender(user.gender || "")
        setPhone(user.phone || "")
        setGoal(user.goal || "")
        setActivityLevel(user.activityLevel || "")
        setMedicalConditions(user.medicalConditions || "")
      } catch (err: any) {
        setError(err.message || "Error al cargar perfil")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    // Validaciones
    if (!name) {
      setError("El nombre es requerido")
      setSaving(false)
      return
    }

    if (age && (isNaN(parseInt(age)) || parseInt(age) < 1 || parseInt(age) > 150)) {
      setError("Por favor ingrese una edad válida (1-150 años)")
      setSaving(false)
      return
    }

    if (weight && (isNaN(parseFloat(weight)) || parseFloat(weight) < 1 || parseFloat(weight) > 500)) {
      setError("Por favor ingrese un peso válido (1-500 kg)")
      setSaving(false)
      return
    }

    if (height && (isNaN(parseFloat(height)) || parseFloat(height) < 50 || parseFloat(height) > 300)) {
      setError("Por favor ingrese una estatura válida (50-300 cm)")
      setSaving(false)
      return
    }

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          age: age || undefined,
          weight: weight || undefined,
          height: height || undefined,
          gender: gender || undefined,
          phone: phone || undefined,
          goal: goal || undefined,
          activityLevel: activityLevel || undefined,
          medicalConditions: medicalConditions || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar perfil")
      }

      setSuccess("Perfil actualizado exitosamente")
      if (onUpdate) {
        onUpdate()
      }

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Error al actualizar perfil")
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>Mi Perfil</CardTitle>
        </div>
        <CardDescription>Actualiza tu información personal y del gimnasio</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">El correo electrónico no se puede cambiar</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="age">Edad (años)</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min={1}
                max={150}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min={1}
                max={500}
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Estatura (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min={50}
                max={300}
                step="0.1"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <Select value={gender} onValueChange={(value: "masculino" | "femenino" | "otro") => setGender(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="goal">Objetivo</Label>
              <Select value={goal} onValueChange={(value: "perder_peso" | "ganar_masa" | "mantenimiento" | "tonificar" | "resistencia" | "otro") => setGoal(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="perder_peso">Perder peso</SelectItem>
                  <SelectItem value="ganar_masa">Ganar masa muscular</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="tonificar">Tonificar</SelectItem>
                  <SelectItem value="resistencia">Mejorar resistencia</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityLevel">Nivel de actividad</Label>
              <Select value={activityLevel} onValueChange={(value: "principiante" | "intermedio" | "avanzado") => setActivityLevel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principiante">Principiante</SelectItem>
                  <SelectItem value="intermedio">Intermedio</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalConditions">Condiciones médicas o lesiones (opcional)</Label>
            <Textarea
              id="medicalConditions"
              placeholder="Ej: Lesión en rodilla, hipertensión..."
              value={medicalConditions}
              onChange={(e) => setMedicalConditions(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

