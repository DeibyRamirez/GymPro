"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dumbbell } from "lucide-react"
import type { User } from "@/lib/auth"

interface RegisterFormProps {
  onRegister: (user: User) => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onRegister, onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"admin" | "trainer" | "client">("client")
  // Campos de información del gimnasio
  const [age, setAge] = useState("")
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [gender, setGender] = useState<"masculino" | "femenino" | "otro" | "">("")
  const [phone, setPhone] = useState("")
  const [goal, setGoal] = useState<"perder_peso" | "ganar_masa" | "mantenimiento" | "tonificar" | "resistencia" | "otro" | "">("")
  const [activityLevel, setActivityLevel] = useState<"principiante" | "intermedio" | "avanzado" | "">("")
  const [medicalConditions, setMedicalConditions] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones
    if (!name || !email || !password) {
      setError("Todos los campos básicos son requeridos")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    // Validaciones para clientes
    if (role === "client") {
      if (!age || !weight || !height || !gender || !phone || !goal || !activityLevel) {
        setError("Para clientes, todos los campos de información del gimnasio son requeridos")
        return
      }

      const ageNum = parseInt(age)
      const weightNum = parseFloat(weight)
      const heightNum = parseFloat(height)

      if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
        setError("Por favor ingrese una edad válida (1-150 años)")
        return
      }

      if (isNaN(weightNum) || weightNum < 1 || weightNum > 500) {
        setError("Por favor ingrese un peso válido (1-500 kg)")
        return
      }

      if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
        setError("Por favor ingrese una estatura válida (50-300 cm)")
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          // Solo incluir campos de gimnasio si es cliente
          ...(role === "client" && {
            age: parseInt(age),
            weight: parseFloat(weight),
            height: parseFloat(height),
            gender,
            phone,
            goal,
            activityLevel,
            medicalConditions: medicalConditions || undefined,
          }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al registrar usuario")
        setLoading(false)
        return
      }

      // Convertir el usuario de la respuesta al formato esperado
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar,
        trainerId: data.user.trainerId,
      }

      onRegister(user)
    } catch (err) {
      setError("Error de conexión. Por favor intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-balance">Crear Cuenta</CardTitle>
            <CardDescription className="text-base mt-2">Únete a FitPro Manager</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
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
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de cuenta</Label>
              <Select value={role} onValueChange={(value: "admin" | "trainer" | "client") => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="trainer">Entrenador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campos de información del gimnasio - Solo para clientes */}
            {role === "client" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="age">Edad (años)</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
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
                    required
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
                    required
                    min={50}
                    max={300}
                    step="0.1"
                  />
                </div>
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
                    required
                  />
                </div>
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
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Registrando..." : "Registrarse"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary hover:underline font-medium"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

