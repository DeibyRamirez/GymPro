"use client"

import { StatsCard } from "@/components/admin/stats-card"
import { UsersTable } from "@/components/admin/users-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User } from "@/lib/auth"
import { ArrowRight, Crown, Dumbbell, LayoutDashboard, Plus, ShieldCheck, Users, Warehouse } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type GymItem = { id: string; name: string; slug: string; location: string; status: string; adminEmail?: string }

export default function SuperAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Array<User & { trainerId?: string; isActive?: boolean; gymSlug?: string | null }>>([])
  const [gyms, setGyms] = useState<GymItem[]>([])
  const [gymName, setGymName] = useState("")
  const [gymSlug, setGymSlug] = useState("")
  const [gymLocation, setGymLocation] = useState("")
  const [gymEmail, setGymEmail] = useState("")
  const [gymAdminEmail, setGymAdminEmail] = useState("")
  const [gymAdminPassword, setGymAdminPassword] = useState("")

  useEffect(() => {
    const load = async () => {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      const meData = await meRes.json()
      if (!meRes.ok || meData.user?.role !== 'superadmin') {
        router.replace('/app')
        return
      }

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

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalGyms: gyms.length,
    activeGyms: gyms.filter((gym) => gym.status === 'active').length,
    superadmins: users.filter((user) => user.role === 'superadmin').length,
  }), [users, gyms])

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

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6 xl:px-2 2xl:px-4">
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-primary/10" />
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-primary/10" />

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-1">
              <Badge variant="outline" className="gap-1.5 text-xs"><LayoutDashboard className="h-3 w-3" /> Superadmin</Badge>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Panel Global Saas GymPro</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">Gestiona gimnasios, usuarios, planes e inventario de toda la plataforma.</p>
            </div>
            <Button variant="outline" onClick={async () => { try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }) } finally { router.replace('/login'); router.refresh() } }}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Cerrar sesión
            </Button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard title="Usuarios" value={stats.totalUsers} description="Total en el SaaS" icon={Users} />
          <StatsCard title="Gimnasios" value={stats.totalGyms} description="Tenants creados" icon={Warehouse} />
          <StatsCard title="Activos" value={stats.activeGyms} description="Gimnasios activos" icon={Dumbbell} />
          <StatsCard title="Superadmins" value={stats.superadmins} description="Acceso total" icon={Crown} />
        </div>

        <Tabs defaultValue="gyms">
          <TabsList className="grid w-full grid-cols-3">
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
                <Input placeholder="Slug" value={gymSlug} onChange={(e) => setGymSlug(e.target.value)} />
                <Input placeholder="Ubicación" value={gymLocation} onChange={(e) => setGymLocation(e.target.value)} />
                <Input placeholder="Correo del gimnasio" value={gymEmail} onChange={(e) => setGymEmail(e.target.value)} />
                <Input placeholder="Correo admin" value={gymAdminEmail} onChange={(e) => setGymAdminEmail(e.target.value)} />
                <PasswordInput placeholder="Password admin" value={gymAdminPassword} onChange={(e) => setGymAdminPassword(e.target.value)} />
                <Button className="md:col-span-2" onClick={createGym}><Plus className="mr-2 h-4 w-4" /> Crear gimnasio</Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {gyms.map((gym) => (
                <Card key={gym.id}>
                  <CardHeader><CardTitle>{gym.name}</CardTitle><CardDescription>{gym.location}</CardDescription></CardHeader>
                  <CardContent className="flex items-center justify-between"><Badge>{gym.status}</Badge><Button variant="outline" size="sm" onClick={() => router.push(`/portal/${gym.slug}/home`)}>Abrir portal <ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent>
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
              <CardHeader><CardTitle>Inventario global</CardTitle><CardDescription>Acceso a stock y ventas de todos los gimnasios.</CardDescription></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Este módulo se conectará a vista global de productos y ventas.</p></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
