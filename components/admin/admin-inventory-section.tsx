"use client"

import { InventoryPosPanel } from "@/components/admin/inventory-pos-panel"
import { DashboardSectionShell } from "@/components/dashboard/dashboard-section-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudinaryImageUpload } from "@/components/ui/cloudinary-image-upload"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  CreditCard,
  Dumbbell,
  LayoutGrid,
  PackagePlus,
  Plus,
  ShoppingBag,
  Store,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useState } from "react"

type InventoryPanel = "overview" | "memberships" | "products" | "equipment" | "pos"

type GymPlan = { name: string; price?: number; description?: string; featured?: boolean }
type GymEquipment = {
  id?: string
  name: string
  category: "cardio" | "fuerza" | "funcional" | "accesorio" | "otro"
  description?: string
  image?: string
  quantity: number
  gymId?: string
}
type ProductItem = {
  id?: string
  name: string
  description?: string
  category: "suplemento" | "accesorio" | "bebida"
  price: number
  stock: number
  lowStockThreshold: number
  image?: string
  images?: string[]
  gymId?: string
}

type NavItem = {
  id: InventoryPanel
  label: string
  hint: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Resumen",
    hint: "Guía del módulo",
    icon: LayoutGrid,
  },
  {
    id: "memberships",
    label: "Membresías",
    hint: "Planes para clientes",
    icon: CreditCard,
  },
  {
    id: "products",
    label: "Productos",
    hint: "Catálogo de tienda",
    icon: ShoppingBag,
  },
  {
    id: "equipment",
    label: "Equipamiento",
    hint: "Máquinas del gym",
    icon: Dumbbell,
  },
  {
    id: "pos",
    label: "Punto de venta",
    hint: "Cobros y stock",
    icon: PackagePlus,
  },
]

const PANEL_COPY: Record<
  Exclude<InventoryPanel, "overview">,
  { title: string; description: string; adminTask: string; userImpact: string }
> = {
  memberships: {
    title: "Planes de membresía",
    description: "Define los precios y beneficios que verán los clientes al registrarse.",
    adminTask: "Crea, edita o elimina planes con nombre, precio y descripción.",
    userImpact: "Los clientes eligen un plan durante el registro en el portal del gimnasio.",
  },
  products: {
    title: "Catálogo de productos",
    description: "Suplementos, accesorios y bebidas disponibles para venta.",
    adminTask: "Registra productos con precio, stock, categoría e imágenes.",
    userImpact: "Aparecen en la tienda del portal y en el punto de venta interno.",
  },
  equipment: {
    title: "Equipamiento",
    description: "Inventario de máquinas y material del gimnasio.",
    adminTask: "Añade equipos con categoría, cantidad y descripción.",
    userImpact: "Se muestra en el portal público para que los visitantes conozcan las instalaciones.",
  },
  pos: {
    title: "Punto de venta (POS)",
    description: "Operación diaria de cobros y control de existencias.",
    adminTask: "Registra ventas, asocia clientes y revisa alertas de stock bajo.",
    userImpact: "Descuenta stock automáticamente al confirmar una venta.",
  },
}

interface AdminInventorySectionProps {
  gymSlug: string
  gymName?: string
  onBack: () => void
}

export function AdminInventorySection({
  gymSlug,
  gymName,
  onBack,
}: AdminInventorySectionProps) {
  const [activePanel, setActivePanel] = useState<InventoryPanel>("overview")
  const [equipment, setEquipment] = useState<GymEquipment[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [plans, setPlans] = useState<GymPlan[]>([])
  const [planForm, setPlanForm] = useState({
    name: "",
    price: "",
    description: "",
    featured: false,
  })
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category: "suplemento" as ProductItem["category"],
    price: "",
    stock: "",
    lowStockThreshold: "5",
    images: [] as string[],
  })
  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    description: "",
    category: "fuerza" as GymEquipment["category"],
    quantity: "1",
    image: "",
  })

  useEffect(() => {
    if (!gymSlug) return

    const loadInventory = async () => {
      const [equipmentRes, productsRes, gymRes] = await Promise.all([
        fetch(`/api/gym-equipment?gymSlug=${gymSlug}`, { credentials: "include" }),
        fetch(`/api/products?gymSlug=${gymSlug}`, { credentials: "include" }),
        fetch(`/api/gyms/${gymSlug}`, { credentials: "include" }),
      ])

      const equipmentData = await equipmentRes.json()
      const productsData = await productsRes.json()
      const gymData = await gymRes.json()

      setEquipment(equipmentData.equipment || [])
      setProducts((productsData.products || []) as ProductItem[])
      setPlans((gymData.gym?.plans || []) as GymPlan[])
    }

    loadInventory()
  }, [gymSlug])

  const saveProduct = async () => {
    if (!gymSlug || !productForm.name || !productForm.price) return

    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: Number(productForm.price),
        stock: Number(productForm.stock) || 0,
        lowStockThreshold: Number(productForm.lowStockThreshold) || 5,
        images: productForm.images,
        image: productForm.images[0] || "/placeholder.svg",
        gymSlug,
      }),
    })

    setProductForm({
      name: "",
      description: "",
      category: "suplemento",
      price: "",
      stock: "",
      lowStockThreshold: "5",
      images: [],
    })

    const res = await fetch(`/api/products?gymSlug=${gymSlug}`, { credentials: "include" })
    const data = await res.json()
    setProducts((data.products || []) as ProductItem[])
  }

  const saveEquipment = async () => {
    if (!gymSlug || !equipmentForm.name) return

    await fetch("/api/gym-equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        gymSlug,
        name: equipmentForm.name,
        description: equipmentForm.description,
        category: equipmentForm.category,
        quantity: Number(equipmentForm.quantity) || 1,
        image: equipmentForm.image || "/placeholder.svg",
      }),
    })

    setEquipmentForm({ name: "", description: "", category: "fuerza", quantity: "1", image: "" })

    const res = await fetch(`/api/gym-equipment?gymSlug=${gymSlug}`, { credentials: "include" })
    const data = await res.json()
    setEquipment(data.equipment || [])
  }

  const savePlan = async () => {
    if (!gymSlug || !planForm.name) return

    const nextPlans = [
      ...plans.filter((plan) => plan.name.toLowerCase() !== planForm.name.toLowerCase()),
      {
        name: planForm.name,
        price: planForm.price ? Number(planForm.price) : undefined,
        description: planForm.description,
        featured: planForm.featured,
      },
    ]

    await fetch("/api/gyms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ slug: gymSlug, plans: nextPlans }),
    })

    setPlanForm({ name: "", price: "", description: "", featured: false })
    setPlans(nextPlans)
  }

  const deletePlan = async (planName: string) => {
    const nextPlans = plans.filter((plan) => plan.name !== planName)

    await fetch("/api/gyms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ slug: gymSlug, plans: nextPlans }),
    })

    setPlans(nextPlans)
  }

  const navCounts: Partial<Record<InventoryPanel, number>> = {
    memberships: plans.length,
    products: products.length,
    equipment: equipment.length,
    pos: products.filter((p) => p.stock <= p.lowStockThreshold).length,
  }

  const activeNav = NAV_ITEMS.find((item) => item.id === activePanel) ?? NAV_ITEMS[0]

  const renderOverview = () => (
    <div className="space-y-6">
      <Card className="rounded-2xl border bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="h-5 w-5" />
            {gymName || gymSlug || "Tu gimnasio"}
          </CardTitle>
          <CardDescription>
            Este módulo concentra todo lo comercial del establecimiento: membresías, tienda,
            equipamiento y ventas. Usa el menú lateral para ir sección por sección.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-background/80 p-4 text-sm">
            <p className="font-medium">Rol administrador</p>
            <p className="mt-1 text-muted-foreground">
              Configura catálogos, precios e inventario. Solo ves datos de tu gimnasio.
            </p>
          </div>
          <div className="rounded-xl border bg-background/80 p-4 text-sm">
            <p className="font-medium">Impacto en clientes</p>
            <p className="mt-1 text-muted-foreground">
              Membresías y equipamiento aparecen en el portal. Los productos se venden desde la tienda y el POS.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {(Object.keys(PANEL_COPY) as Array<Exclude<InventoryPanel, "overview">>).map((panelId) => {
          const copy = PANEL_COPY[panelId]
          const nav = NAV_ITEMS.find((item) => item.id === panelId)
          const Icon = nav?.icon ?? LayoutGrid
          const count = navCounts[panelId]

          return (
            <Card key={panelId} className="rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{copy.title}</CardTitle>
                      <CardDescription className="mt-1">{copy.description}</CardDescription>
                    </div>
                  </div>
                  {typeof count === "number" ? (
                    <Badge variant="secondary">{count} registrados</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                  <p className="font-medium text-foreground">Qué hace el admin</p>
                  <p className="mt-1 text-muted-foreground">{copy.adminTask}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                  <p className="font-medium text-foreground">Qué ve el usuario</p>
                  <p className="mt-1 text-muted-foreground">{copy.userImpact}</p>
                </div>
                <Button
                  variant="outline"
                  className="md:col-span-2 w-fit gap-2"
                  onClick={() => setActivePanel(panelId)}
                >
                  Ir a {nav?.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const renderMemberships = () => (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Planes de membresía</CardTitle>
        <CardDescription>
          Los clientes eligen uno de estos planes al registrarse en el portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Nombre del plan"
            value={planForm.name}
            onChange={(e) => setPlanForm((current) => ({ ...current, name: e.target.value }))}
          />
          <Input
            placeholder="Precio mensual"
            type="number"
            value={planForm.price}
            onChange={(e) => setPlanForm((current) => ({ ...current, price: e.target.value }))}
          />
        </div>
        <Textarea
          placeholder="Descripción del plan"
          value={planForm.description}
          onChange={(e) => setPlanForm((current) => ({ ...current, description: e.target.value }))}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={planForm.featured}
            onChange={(e) => setPlanForm((current) => ({ ...current, featured: e.target.checked }))}
          />
          Marcar como plan recomendado
        </label>
        <Button onClick={savePlan} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Guardar plan
        </Button>

        <div className="grid gap-3 pt-2">
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay planes registrados.</p>
          ) : (
            plans.map((plan) => (
              <div key={plan.name} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {typeof plan.price === "number" ? `$${plan.price}` : "Sin precio"}
                    {plan.featured ? " · Recomendado" : ""}
                  </p>
                  {plan.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  ) : null}
                </div>
                <Button variant="ghost" size="sm" onClick={() => deletePlan(plan.name)}>
                  Eliminar
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderProducts = () => (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Catálogo de productos</CardTitle>
        <CardDescription>Suplementos, accesorios y bebidas disponibles en tienda y POS.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Nombre del producto"
            value={productForm.name}
            onChange={(e) => setProductForm((current) => ({ ...current, name: e.target.value }))}
          />
          <Select
            value={productForm.category}
            onValueChange={(value: ProductItem["category"]) =>
              setProductForm((current) => ({ ...current, category: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="suplemento">Suplemento</SelectItem>
              <SelectItem value="accesorio">Accesorio</SelectItem>
              <SelectItem value="bebida">Bebida</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Precio"
            type="number"
            value={productForm.price}
            onChange={(e) => setProductForm((current) => ({ ...current, price: e.target.value }))}
          />
          <Input
            placeholder="Stock inicial"
            type="number"
            value={productForm.stock}
            onChange={(e) => setProductForm((current) => ({ ...current, stock: e.target.value }))}
          />
          <Input
            placeholder="Alerta stock bajo"
            type="number"
            value={productForm.lowStockThreshold}
            onChange={(e) =>
              setProductForm((current) => ({ ...current, lowStockThreshold: e.target.value }))
            }
          />
        </div>
        <CloudinaryImageUpload
          label="Imágenes del producto"
          value={productForm.images}
          onChange={(images) => setProductForm((current) => ({ ...current, images }))}
          folder="gympro/products"
        />
        <Textarea
          placeholder="Descripción"
          value={productForm.description}
          onChange={(e) => setProductForm((current) => ({ ...current, description: e.target.value }))}
        />
        <Button onClick={saveProduct} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Guardar producto
        </Button>

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">Aún no hay productos registrados.</p>
          ) : (
            products.map((product) => (
              <div key={product.id || product.name} className="rounded-xl border p-4 text-sm">
                <p className="font-medium">{product.name}</p>
                <p className="text-muted-foreground">
                  ${product.price} · Stock: {product.stock} · {product.category}
                </p>
                {(product.images?.[0] || product.image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images?.[0] || product.image}
                    alt={product.name}
                    className="mt-2 h-16 w-16 rounded-lg border object-cover"
                  />
                ) : null}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderEquipment = () => (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Equipamiento</CardTitle>
        <CardDescription>Máquinas y material visible en el portal público del gimnasio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Nombre del equipo"
            value={equipmentForm.name}
            onChange={(e) => setEquipmentForm((current) => ({ ...current, name: e.target.value }))}
          />
          <Select
            value={equipmentForm.category}
            onValueChange={(value: GymEquipment["category"]) =>
              setEquipmentForm((current) => ({ ...current, category: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="fuerza">Fuerza</SelectItem>
              <SelectItem value="funcional">Funcional</SelectItem>
              <SelectItem value="accesorio">Accesorio</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Cantidad"
            type="number"
            value={equipmentForm.quantity}
            onChange={(e) => setEquipmentForm((current) => ({ ...current, quantity: e.target.value }))}
          />
          <Input
            placeholder="URL de imagen (opcional)"
            value={equipmentForm.image}
            onChange={(e) => setEquipmentForm((current) => ({ ...current, image: e.target.value }))}
          />
        </div>
        <Textarea
          placeholder="Descripción"
          value={equipmentForm.description}
          onChange={(e) => setEquipmentForm((current) => ({ ...current, description: e.target.value }))}
        />
        <Button onClick={saveEquipment} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Guardar equipamiento
        </Button>

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          {equipment.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">Aún no hay equipamiento registrado.</p>
          ) : (
            equipment.map((item) => (
              <div key={item.id || item.name} className="rounded-xl border p-4 text-sm">
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">
                  {item.category} · Cantidad: {item.quantity}
                </p>
                {item.description ? (
                  <p className="mt-1 text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderPos = () => (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Punto de venta</CardTitle>
        <CardDescription>
          Registra cobros en mostrador y revisa alertas cuando el stock esté bajo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InventoryPosPanel />
      </CardContent>
    </Card>
  )

  const renderPanelContent = () => {
    switch (activePanel) {
      case "overview":
        return renderOverview()
      case "memberships":
        return renderMemberships()
      case "products":
        return renderProducts()
      case "equipment":
        return renderEquipment()
      case "pos":
        return renderPos()
      default:
        return renderOverview()
    }
  }

  return (
    <DashboardSectionShell
      title="Inventario y tienda"
      description="Gestiona membresías, productos, equipamiento y ventas desde secciones independientes."
      onBack={onBack}
    >
      <div className="lg:hidden">
        <Select value={activePanel} onValueChange={(value: InventoryPanel) => setActivePanel(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una sección" />
          </SelectTrigger>
          <SelectContent>
            {NAV_ITEMS.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="hidden shrink-0 lg:block lg:w-64">
          <nav className="sticky top-24 space-y-2 rounded-2xl border bg-card/80 p-3 shadow-sm">
            <div className="mb-3 rounded-xl border bg-muted/40 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Gimnasio
              </p>
              <p className="text-sm font-semibold">{gymName || gymSlug || "Sin asignar"}</p>
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const count = navCounts[item.id]
              const isActive = activePanel === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePanel(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted/70",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "" : "text-muted-foreground")} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span
                      className={cn(
                        "block truncate text-xs",
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground",
                      )}
                    >
                      {item.hint}
                    </span>
                  </span>
                  {typeof count === "number" && count > 0 ? (
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className={cn("shrink-0", isActive && "bg-primary-foreground/15 text-primary-foreground")}
                    >
                      {count}
                    </Badge>
                  ) : null}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-2xl border bg-card/60 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sección activa</p>
            <h3 className="text-lg font-semibold">{activeNav.label}</h3>
            <p className="text-sm text-muted-foreground">
              {activePanel === "overview"
                ? "Panorama general del módulo comercial y guía de uso por rol."
                : PANEL_COPY[activePanel as Exclude<InventoryPanel, "overview">]?.description}
            </p>
          </div>

          {renderPanelContent()}
        </div>
      </div>
    </DashboardSectionShell>
  )
}
