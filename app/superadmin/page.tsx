"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UsersTable } from "@/components/admin/users-table"
import { StatsCard } from "@/components/admin/stats-card"
import { Crown, Dumbbell, Users, Warehouse } from "lucide-react"
import type { User } from "@/lib/auth"

type GymItem = { id: string; name: string; slug: string; location: string; status: string; adminEmail?: string }

// Página principal del superadmin, con gestión global de gimnasios, usuarios y estadísticas de la plataforma
export default function SuperAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<Array<User & { trainerId?: string; isActive?: boolean; gymSlug?: string | null }>>([])
  const [gyms, setGyms] = useState<GymItem[]>([])
  const [gymName, setGymName] = useState("")
  const [gymSlug, setGymSlug] = useState("")
  const [gymLocation, setGymLocation] = useState("")
  const [gymEmail, setGymEmail] = useState("")
  const [gymAdminEmail, setGymAdminEmail] = useState("")
  const [gymAdminPassword, setGymAdminPassword] = useState("")

  useEffect(() => {
    // Verifica la sesión del usuario y carga datos iniciales para el dashboard
    const load = async () => {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      const meData = await meRes.json()
      if (!meRes.ok || meData.user?.role !== 'superadmin') {
        router.replace('/app')
        return
      }

      // Si el usuario es superadmin, carga usuarios y gimnasios para mostrar en el dashboard
      setCurrentUser(meData.user)
      const [usersRes, gymsRes] = await Promise.all([
        fetch('/api/users', { credentials: 'include' }),
        fetch('/api/gyms', { credentials: 'include' }),
      ])
      const usersData = await usersRes.json()
      const gymsData = await gymsRes.json()
      setUsers(usersData.users || [])
      setGyms(gymsData.gyms || [])
      setLoading(false)
    }

    load()
  }, [router])

  // Calcula estadísticas globales de la plataforma para mostrar en el dashboard del superadmin
  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalGyms: gyms.length,
    activeGyms: gyms.filter((gym) => gym.status === 'active').length,
    superadmins: users.filter((user) => user.role === 'superadmin').length,
  }), [users, gyms])

  // Función para crear un nuevo gimnasio (tenant) desde el dashboard del superadmin
  const createGym = async () => {
    await fetch('/api/gyms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: gymName,
        slug: gymSlug,
        location: gymLocation,
        email: gymEmail,
        adminEmail: gymAdminEmail,
        adminPassword: gymAdminPassword,
      }),
    })
  }

  if (loading) return <div className="min-h-screen p-10">Cargando...</div>

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Badge variant="outline">Superadmin</Badge>
            <h1 className="mt-2 text-3xl font-bold">Panel Global Saas GymPro</h1>
            <p className="text-muted-foreground">Gestiona gimnasios, usuarios, planes e inventario de toda la plataforma.</p>
          </div>
            <Button
            variant="outline"
            onClick={async () => {
              try {
              await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
              })
              } finally {
              router.replace("/login")
              router.refresh()
              }
            }}
            >
            Cerrar sesión
            </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard title="Usuarios" value={stats.totalUsers} description="Total en el SaaS" icon={Users} />
          <StatsCard title="Gimnasios" value={stats.totalGyms} description="Tenants creados" icon={Warehouse} />
          <StatsCard title="Activos" value={stats.activeGyms} description="Gimnasios activos" icon={Dumbbell} />
          <StatsCard title="Superadmins" value={stats.superadmins} description="Acceso total" icon={Crown} />
        </div>

        <Tabs defaultValue="gyms">
          <TabsList>
            <TabsTrigger value="gyms">Gimnasios</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
          </TabsList>

          <TabsContent value="gyms" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crear gimnasio</CardTitle>
                <CardDescription>Alta de tenant con admin inicial.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Nombre" value={gymName} onChange={(e) => setGymName(e.target.value)} />
                <Input placeholder="Slug" value={gymSlug} onChange={(e) => setGymSlug(e.target.value)} /> // El slug es el identificador único del gimnasio en la URL y debe ser único en toda la plataforma
                <Input placeholder="Ubicación" value={gymLocation} onChange={(e) => setGymLocation(e.target.value)} />
                <Input placeholder="Correo del gimnasio" value={gymEmail} onChange={(e) => setGymEmail(e.target.value)} />
                <Input placeholder="Correo admin" value={gymAdminEmail} onChange={(e) => setGymAdminEmail(e.target.value)} />
                <Input placeholder="Password admin" type="password" value={gymAdminPassword} onChange={(e) => setGymAdminPassword(e.target.value)} />
                <Button className="md:col-span-2" onClick={createGym}>Crear gimnasio</Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {gyms.map((gym) => (
                <Card key={gym.id}>
                  <CardHeader>
                    <CardTitle>{gym.name}</CardTitle>
                    <CardDescription>{gym.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Badge>{gym.status}</Badge>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/portal/${gym.slug}/home`)}>Abrir portal</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersTable users={users} onRefresh={async () => {
              const usersRes = await fetch('/api/users', { credentials: 'include' })
              const usersData = await usersRes.json()
              setUsers(usersData.users || [])
            }} />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventario global</CardTitle>
                <CardDescription>Acceso a stock y ventas de todos los gimnasios.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Este módulo se conectará a vista global de productos y ventas.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
