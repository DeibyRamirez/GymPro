"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { User } from "@/lib/auth"
import { ArrowRight, ChartNoAxesCombined, Dumbbell, LayoutDashboard, PackagePlus, Plus, ShieldCheck, ShoppingBag, Users, Warehouse } from "lucide-react"
import { useEffect, useState } from "react"
import { ActivityFeed } from "./activity-feed"
import { InventoryPosPanel } from "./inventory-pos-panel"
import { StatsCard } from "./stats-card"
import { UsersTable } from "./users-table"

type GymItem = { id: string; name: string; slug: string; location: string; status: string; adminEmail?: string }
type GymPlan = { name: string; price?: number; description?: string; featured?: boolean }
type GymEquipment = { id?: string; name: string; category: 'cardio' | 'fuerza' | 'funcional' | 'accesorio' | 'otro'; description?: string; image?: string; quantity: number; gymId?: string }
type ProductItem = { id?: string; name: string; description?: string; category: 'suplemento' | 'accesorio' | 'bebida'; price: number; stock: number; lowStockThreshold: number; image?: string; gymId?: string }
type CurrentMe = { user?: { gymSlug?: string | null } }

type DashboardStats = { totalUsers?: number; totalTrainers?: number; totalClients?: number; recentUsers?: User[] }

function NavAction({ icon: Icon, label, onClick, accent }: { icon: React.ElementType; label: string; onClick?: () => void; accent: string }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-2 rounded-2xl border bg-card/60 px-5 py-4 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-md">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${accent}`}><Icon className="h-5 w-5" /></div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
    </button>
  )
}

export function AdminDashboard() {
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'dashboard' | 'inventory'>('dashboard')
  const [users, setUsers] = useState<Array<User & { trainerId?: string; isActive?: boolean }>>([])
  const [gyms, setGyms] = useState<GymItem[]>([])
  const [selectedGymSlug, setSelectedGymSlug] = useState<string>("")
  const [equipment, setEquipment] = useState<GymEquipment[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [plans, setPlans] = useState<GymPlan[]>([])
  const [productForm, setProductForm] = useState({ name: "", description: "", category: "suplemento" as ProductItem['category'], price: "", stock: "", lowStockThreshold: "5", image: "" })
  const [equipmentForm, setEquipmentForm] = useState({ name: "", description: "", category: "fuerza" as GymEquipment['category'], quantity: "1", image: "" })
  const [planForm, setPlanForm] = useState({ name: "", price: "", description: "", featured: false })

  useEffect(() => {
    async function fetchDashboardAdmin() {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/dashboard/stats", { method: "GET", credentials: "include" }),
          fetch("/api/users", { method: "GET", credentials: "include" }),
        ])
        const statsData = await statsRes.json()
        const usersData = await usersRes.json()
        setStats(statsData.stats)
        setUsers(usersData.users || [])
        const meRes = await fetch('/api/auth/me', { credentials: 'include' })
        const meData = (await meRes.json()) as CurrentMe
        setSelectedGymSlug(meData.user?.gymSlug || '')
        const gymsRes = await fetch('/api/gyms', { credentials: 'include' })
        const gymsData = await gymsRes.json()
        setGyms(gymsData.gyms || [])
        setSelectedGymSlug(meData.user?.gymSlug || gymsData.gyms?.[0]?.slug || '')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardAdmin()
  }, [])

  useEffect(() => {
    if (!selectedGymSlug) return
    const loadInventory = async () => {
      const [equipmentRes, productsRes] = await Promise.all([
        fetch(`/api/gym-equipment?gymSlug=${selectedGymSlug}`, { credentials: 'include' }),
        fetch(`/api/products?gymSlug=${selectedGymSlug}`, { credentials: 'include' }),
      ])
      const gymRes = await fetch(`/api/gyms/${selectedGymSlug}`, { credentials: 'include' })
      const equipmentData = await equipmentRes.json()
      setEquipment(equipmentData.equipment || [])
      const productsData = await productsRes.json()
      setProducts((productsData.products || []) as ProductItem[])
      const gymData = await gymRes.json()
      setPlans((gymData.gym?.plans || []) as GymPlan[])
    }
    loadInventory()
  }, [selectedGymSlug])

  const refreshAdminData = async () => {
    const [statsRes, usersRes] = await Promise.all([
      fetch("/api/dashboard/stats", { method: "GET", credentials: "include" }),
      fetch("/api/users", { method: "GET", credentials: "include" }),
    ])
    const statsData = await statsRes.json()
    const usersData = await usersRes.json()
    setStats(statsData.stats)
    setUsers(usersData.users || [])
  }

  const saveProduct = async () => {
    if (!selectedGymSlug || !productForm.name || !productForm.price) return
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: Number(productForm.price),
        stock: Number(productForm.stock) || 0,
        lowStockThreshold: Number(productForm.lowStockThreshold) || 5,
        image: productForm.image || '/placeholder.svg',
        gymSlug: selectedGymSlug,
      }),
    })
    setProductForm({ name: "", description: "", category: "suplemento", price: "", stock: "", lowStockThreshold: "5", image: "" })
    const res = await fetch(`/api/products?gymSlug=${selectedGymSlug}`, { credentials: 'include' })
    const data = await res.json()
    setProducts((data.products || []) as ProductItem[])
  }

  const saveEquipment = async () => {
    if (!selectedGymSlug || !equipmentForm.name) return
    await fetch('/api/gym-equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        gymSlug: selectedGymSlug,
        name: equipmentForm.name,
        description: equipmentForm.description,
        category: equipmentForm.category,
        quantity: Number(equipmentForm.quantity) || 1,
        image: equipmentForm.image || '/placeholder.svg',
      }),
    })
    setEquipmentForm({ name: "", description: "", category: "fuerza", quantity: "1", image: "" })
    const res = await fetch(`/api/gym-equipment?gymSlug=${selectedGymSlug}`, { credentials: 'include' })
    const data = await res.json()
    setEquipment(data.equipment || [])
  }

  const savePlan = async () => {
    if (!selectedGymSlug || !planForm.name) return
    const nextPlans = [
      ...plans.filter((plan) => plan.name.toLowerCase() !== planForm.name.toLowerCase()),
      {
        name: planForm.name,
        price: planForm.price ? Number(planForm.price) : undefined,
        description: planForm.description,
        featured: planForm.featured,
      },
    ]

    await fetch('/api/gyms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ slug: selectedGymSlug, plans: nextPlans }),
    })

    setPlanForm({ name: "", price: "", description: "", featured: false })
    setPlans(nextPlans)
  }

  const deletePlan = async (planName: string) => {
    const nextPlans = plans.filter((plan) => plan.name !== planName)
    await fetch('/api/gyms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ slug: selectedGymSlug, plans: nextPlans }),
    })
    setPlans(nextPlans)
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  if (view === 'inventory') {
    return (
      <div className="w-full space-y-6 xl:px-2 2xl:px-4">
        <Button variant="ghost" onClick={() => setView('dashboard')} className="w-fit">Volver al dashboard</Button>
        <Card className="rounded-3xl border bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Warehouse className="h-4 w-4" /> Inventario de mi gimnasio</CardTitle>
            <CardDescription>Gestiona productos y máquinas sólo del gym asociado a tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">Aquí se conecta el CRUD del gimnasio del admin. Se carga por el gymId de su sesión.</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 xl:px-2 2xl:px-4">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-primary/10" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-1">
            <Badge variant="outline" className="gap-1.5 text-xs"><LayoutDashboard className="h-3 w-3" /> Panel de administración</Badge>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Control global de la plataforma</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">Gestiona usuarios, métricas e inventario con la misma estética del SaaS.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatsCard title="Usuarios" value={stats?.totalUsers ?? 0} description="Registrados" icon={Users} trend={{ value: 12, isPositive: true }} />
            <StatsCard title="Entrenadores" value={stats?.totalTrainers ?? 0} description="Activos" icon={Dumbbell} trend={{ value: 8, isPositive: true }} />
            <StatsCard title="Clientes" value={stats?.totalClients ?? 0} description="Activos" icon={Users} trend={{ value: 15, isPositive: true }} />
            <StatsCard title="Seguridad" value={"OK" as never} description="Acceso controlado" icon={ShieldCheck} trend={{ value: 100, isPositive: true }} />
          </div>
        </div>

        <Separator className="my-6 opacity-50" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NavAction icon={Users} label="Usuarios" accent="bg-blue-500/15 text-blue-600" />
          <NavAction icon={ShoppingBag} label="Inventario gimnasio" onClick={() => setView('inventory')} accent="bg-violet-500/15 text-violet-600" />
          <NavAction icon={ChartNoAxesCombined} label="Métricas" accent="bg-amber-500/15 text-amber-600" />
        </div>
      </section>

      <Card className="rounded-3xl border bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PackagePlus className="h-4 w-4" /> Inventario por gimnasio</CardTitle>
          <CardDescription>Productos para vender y equipamiento físico que se mostrará en el portal de cada gym.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Select value={selectedGymSlug} onValueChange={setSelectedGymSlug}>
              <SelectTrigger><SelectValue placeholder="Selecciona un gimnasio" /></SelectTrigger>
              <SelectContent>
                {gyms.map((gym) => <SelectItem key={gym.slug} value={gym.slug}>{gym.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Planes de membresía</CardTitle>
                <CardDescription>CRUD local de planes del gimnasio seleccionado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Nombre" value={planForm.name} onChange={(e) => setPlanForm((c) => ({ ...c, name: e.target.value }))} />
                  <Input placeholder="Precio" type="number" value={planForm.price} onChange={(e) => setPlanForm((c) => ({ ...c, price: e.target.value }))} />
                </div>
                <Textarea placeholder="Descripción" value={planForm.description} onChange={(e) => setPlanForm((c) => ({ ...c, description: e.target.value }))} />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={planForm.featured} onChange={(e) => setPlanForm((c) => ({ ...c, featured: e.target.checked }))} /> Recomendado</label>
                <Button onClick={savePlan} className="w-full"><Plus className="mr-2 h-4 w-4" /> Guardar plan</Button>
                <div className="grid gap-3">
                  {plans.map((plan) => <div key={plan.name} className="rounded-xl border p-3 text-sm"><p className="font-medium">{plan.name}</p><p className="text-muted-foreground">{typeof plan.price === 'number' ? `$${plan.price}` : 'Sin precio'}</p><Button variant="ghost" size="sm" className="mt-2" onClick={() => deletePlan(plan.name)}>Eliminar</Button></div>)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Productos</CardTitle>
                <CardDescription>Suplementos, accesorios y bebidas por gimnasio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Nombre" value={productForm.name} onChange={(e) => setProductForm((c) => ({ ...c, name: e.target.value }))} />
                  <Select value={productForm.category} onValueChange={(value: ProductItem['category']) => setProductForm((c) => ({ ...c, category: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suplemento">Suplemento</SelectItem>
                      <SelectItem value="accesorio">Accesorio</SelectItem>
                      <SelectItem value="bebida">Bebida</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Precio" type="number" value={productForm.price} onChange={(e) => setProductForm((c) => ({ ...c, price: e.target.value }))} />
                  <Input placeholder="Stock" type="number" value={productForm.stock} onChange={(e) => setProductForm((c) => ({ ...c, stock: e.target.value }))} />
                  <Input placeholder="Umbral bajo stock" type="number" value={productForm.lowStockThreshold} onChange={(e) => setProductForm((c) => ({ ...c, lowStockThreshold: e.target.value }))} />
                  <Input placeholder="Imagen" value={productForm.image} onChange={(e) => setProductForm((c) => ({ ...c, image: e.target.value }))} />
                </div>
                <Textarea placeholder="Descripción" value={productForm.description} onChange={(e) => setProductForm((c) => ({ ...c, description: e.target.value }))} />
                <Button onClick={saveProduct} className="w-full"><Plus className="mr-2 h-4 w-4" /> Guardar producto</Button>
                <div className="grid gap-3">
                  {products.map((product) => <div key={product.id || product.name} className="rounded-xl border p-3 text-sm"><p className="font-medium">{product.name}</p><p className="text-muted-foreground">${product.price} · Stock: {product.stock}</p></div>)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Dumbbell className="h-4 w-4" /> Maquinarias</CardTitle>
                <CardDescription>Equipamiento del gimnasio visible en el portal público.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Nombre" value={equipmentForm.name} onChange={(e) => setEquipmentForm((c) => ({ ...c, name: e.target.value }))} />
                  <Select value={equipmentForm.category} onValueChange={(value: GymEquipment['category']) => setEquipmentForm((c) => ({ ...c, category: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="fuerza">Fuerza</SelectItem>
                      <SelectItem value="funcional">Funcional</SelectItem>
                      <SelectItem value="accesorio">Accesorio</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Cantidad" type="number" value={equipmentForm.quantity} onChange={(e) => setEquipmentForm((c) => ({ ...c, quantity: e.target.value }))} />
                  <Input placeholder="Imagen" value={equipmentForm.image} onChange={(e) => setEquipmentForm((c) => ({ ...c, image: e.target.value }))} />
                </div>
                <Textarea placeholder="Descripción" value={equipmentForm.description} onChange={(e) => setEquipmentForm((c) => ({ ...c, description: e.target.value }))} />
                <Button onClick={saveEquipment} className="w-full"><Plus className="mr-2 h-4 w-4" /> Guardar máquina</Button>
                <div className="grid gap-3">
                  {equipment.map((item) => <div key={item.id || item.name} className="rounded-xl border p-3 text-sm"><p className="font-medium">{item.name}</p><p className="text-muted-foreground">{item.category} · Cantidad: {item.quantity}</p></div>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">Usuarios</p><p className="mt-2 text-3xl font-black">{stats?.totalUsers ?? 0}</p></Card>
        <Card className="rounded-2xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">Entrenadores</p><p className="mt-2 text-3xl font-black">{stats?.totalTrainers ?? 0}</p></Card>
        <Card className="rounded-2xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">Clientes</p><p className="mt-2 text-3xl font-black">{stats?.totalClients ?? 0}</p></Card>
        <Card className="rounded-2xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">Actividad</p><p className="mt-2 text-3xl font-black">Live</p></Card>
      </div> */}

      <div className="space-y-8">
        <div className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">Gestión de usuarios</h3>
            <p className="text-sm text-muted-foreground">Administra roles y permisos de usuarios</p>
          </div>
          <UsersTable users={users} onRefresh={refreshAdminData} />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Actividad reciente</h3>
          <p className="text-sm text-muted-foreground">Últimos movimientos del sistema</p>
        </div>
        <ActivityFeed />
      </div>

      <div className="space-y-5">
        <div className="space-y-1"><h3 className="text-xl font-semibold">Inventario y POS</h3><p className="text-sm text-muted-foreground">Control operativo de productos y ventas</p></div>
        <InventoryPosPanel />
      </div>

      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowRight className="h-4 w-4" /> Panel extendido</CardTitle>
          <CardDescription>La misma experiencia visual se puede replicar al resto de módulos administrativos.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
