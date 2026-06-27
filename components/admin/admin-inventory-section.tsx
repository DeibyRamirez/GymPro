"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CloudinaryImageUpload } from "@/components/ui/cloudinary-image-upload"
import { InventoryPosPanel } from "@/components/admin/inventory-pos-panel"
import { DashboardSectionShell } from "@/components/dashboard/dashboard-section-shell"
import { Dumbbell, PackagePlus, Plus, ShoppingBag, Store, Warehouse } from "lucide-react"
import { useEffect, useState } from "react"

type GymItem = { id: string; name: string; slug: string; location: string; status: string; adminEmail?: string }
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

interface AdminInventorySectionProps {
  gyms: GymItem[]
  selectedGymSlug: string
  onGymChange: (slug: string) => void
  onBack: () => void
}

export function AdminInventorySection({
  gyms,
  selectedGymSlug,
  onGymChange,
  onBack,
}: AdminInventorySectionProps) {
  const [equipment, setEquipment] = useState<GymEquipment[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [plans, setPlans] = useState<GymPlan[]>([])
  const [planForm, setPlanForm] = useState({
    name: "",
    price: "",
    description: "",
    featured: false,
  })
  const [gymLogo, setGymLogo] = useState<string[]>([])
  const [gymCover, setGymCover] = useState<string[]>([])
  const [savingBranding, setSavingBranding] = useState(false)
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
    if (!selectedGymSlug) return

    const loadInventory = async () => {
      const [equipmentRes, productsRes, gymRes] = await Promise.all([
        fetch(`/api/gym-equipment?gymSlug=${selectedGymSlug}`, { credentials: "include" }),
        fetch(`/api/products?gymSlug=${selectedGymSlug}`, { credentials: "include" }),
        fetch(`/api/gyms/${selectedGymSlug}`, { credentials: "include" }),
      ])

      const equipmentData = await equipmentRes.json()
      const productsData = await productsRes.json()
      const gymData = await gymRes.json()

      setEquipment(equipmentData.equipment || [])
      setProducts((productsData.products || []) as ProductItem[])
      setPlans((gymData.gym?.plans || []) as GymPlan[])
      setGymLogo(gymData.gym?.logo ? [gymData.gym.logo] : [])
      setGymCover(gymData.gym?.coverImage ? [gymData.gym.coverImage] : [])
    }

    loadInventory()
  }, [selectedGymSlug])

  const saveGymBranding = async () => {
    if (!selectedGymSlug) return

    setSavingBranding(true)
    try {
      const response = await fetch("/api/gyms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slug: selectedGymSlug,
          logo: gymLogo[0] || "/placeholder-logo.svg",
          coverImage: gymCover[0] || "/athletic-trainer.png",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "No se pudo actualizar la identidad del gimnasio")
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al guardar la identidad del gimnasio")
    } finally {
      setSavingBranding(false)
    }
  }

  const saveProduct = async () => {
    if (!selectedGymSlug || !productForm.name || !productForm.price) return

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
        gymSlug: selectedGymSlug,
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

    const res = await fetch(`/api/products?gymSlug=${selectedGymSlug}`, { credentials: "include" })
    const data = await res.json()
    setProducts((data.products || []) as ProductItem[])
  }

  const saveEquipment = async () => {
    if (!selectedGymSlug || !equipmentForm.name) return

    await fetch("/api/gym-equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        gymSlug: selectedGymSlug,
        name: equipmentForm.name,
        description: equipmentForm.description,
        category: equipmentForm.category,
        quantity: Number(equipmentForm.quantity) || 1,
        image: equipmentForm.image || "/placeholder.svg",
      }),
    })

    setEquipmentForm({ name: "", description: "", category: "fuerza", quantity: "1", image: "" })

    const res = await fetch(`/api/gym-equipment?gymSlug=${selectedGymSlug}`, { credentials: "include" })
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

    await fetch("/api/gyms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ slug: selectedGymSlug, plans: nextPlans }),
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
      body: JSON.stringify({ slug: selectedGymSlug, plans: nextPlans }),
    })

    setPlans(nextPlans)
  }

  return (
    <DashboardSectionShell
      title="Inventario y ventas"
      description="Planes de membresía, productos, equipamiento y punto de venta del gimnasio."
      onBack={onBack}
    >
      <Card className="rounded-3xl border bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Identidad del gimnasio
          </CardTitle>
          <CardDescription>
            Logo e imagen de portada visibles en el portal público del establecimiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <CloudinaryImageUpload
            label="Logo del gimnasio"
            value={gymLogo}
            onChange={setGymLogo}
            folder="gympro/gyms/logos"
            maxImages={1}
          />
          <CloudinaryImageUpload
            label="Imagen de portada"
            value={gymCover}
            onChange={setGymCover}
            folder="gympro/gyms/covers"
            maxImages={1}
          />
          <div className="md:col-span-2">
            <Button onClick={saveGymBranding} disabled={savingBranding || !selectedGymSlug}>
              {savingBranding ? "Guardando..." : "Guardar logo y portada"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Inventario por gimnasio
          </CardTitle>
          <CardDescription>
            Productos para vender y equipamiento visible en el portal de cada gym.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-sm">
            <Select value={selectedGymSlug} onValueChange={onGymChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un gimnasio" />
              </SelectTrigger>
              <SelectContent>
                {gyms.map((gym) => (
                  <SelectItem key={gym.slug} value={gym.slug}>
                    {gym.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Planes de membresía
                </CardTitle>
                <CardDescription>CRUD de planes del gimnasio seleccionado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Nombre"
                    value={planForm.name}
                    onChange={(e) => setPlanForm((current) => ({ ...current, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Precio"
                    type="number"
                    value={planForm.price}
                    onChange={(e) => setPlanForm((current) => ({ ...current, price: e.target.value }))}
                  />
                </div>
                <Textarea
                  placeholder="Descripción"
                  value={planForm.description}
                  onChange={(e) =>
                    setPlanForm((current) => ({ ...current, description: e.target.value }))
                  }
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={planForm.featured}
                    onChange={(e) =>
                      setPlanForm((current) => ({ ...current, featured: e.target.checked }))
                    }
                  />
                  Recomendado
                </label>
                <Button onClick={savePlan} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Guardar plan
                </Button>
                <div className="grid gap-3">
                  {plans.map((plan) => (
                    <div key={plan.name} className="rounded-xl border p-3 text-sm">
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-muted-foreground">
                        {typeof plan.price === "number" ? `$${plan.price}` : "Sin precio"}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => deletePlan(plan.name)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Productos
                </CardTitle>
                <CardDescription>Suplementos, accesorios y bebidas por gimnasio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Nombre"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm((current) => ({ ...current, name: e.target.value }))
                    }
                  />
                  <Select
                    value={productForm.category}
                    onValueChange={(value: ProductItem["category"]) =>
                      setProductForm((current) => ({ ...current, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    onChange={(e) =>
                      setProductForm((current) => ({ ...current, price: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Stock"
                    type="number"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm((current) => ({ ...current, stock: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Umbral bajo stock"
                    type="number"
                    value={productForm.lowStockThreshold}
                    onChange={(e) =>
                      setProductForm((current) => ({
                        ...current,
                        lowStockThreshold: e.target.value,
                      }))
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
                  onChange={(e) =>
                    setProductForm((current) => ({ ...current, description: e.target.value }))
                  }
                />
                <Button onClick={saveProduct} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Guardar producto
                </Button>
                <div className="grid gap-3">
                  {products.map((product) => (
                    <div key={product.id || product.name} className="rounded-xl border p-3 text-sm">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-muted-foreground">
                        ${product.price} · Stock: {product.stock}
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
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Maquinarias
                </CardTitle>
                <CardDescription>
                  Equipamiento del gimnasio visible en el portal público.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Nombre"
                    value={equipmentForm.name}
                    onChange={(e) =>
                      setEquipmentForm((current) => ({ ...current, name: e.target.value }))
                    }
                  />
                  <Select
                    value={equipmentForm.category}
                    onValueChange={(value: GymEquipment["category"]) =>
                      setEquipmentForm((current) => ({ ...current, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    onChange={(e) =>
                      setEquipmentForm((current) => ({ ...current, quantity: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Imagen"
                    value={equipmentForm.image}
                    onChange={(e) =>
                      setEquipmentForm((current) => ({ ...current, image: e.target.value }))
                    }
                  />
                </div>
                <Textarea
                  placeholder="Descripción"
                  value={equipmentForm.description}
                  onChange={(e) =>
                    setEquipmentForm((current) => ({ ...current, description: e.target.value }))
                  }
                />
                <Button onClick={saveEquipment} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Guardar máquina
                </Button>
                <div className="grid gap-3 md:grid-cols-2">
                  {equipment.map((item) => (
                    <div key={item.id || item.name} className="rounded-xl border p-3 text-sm">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">
                        {item.category} · Cantidad: {item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="h-4 w-4" />
            Inventario y POS
          </CardTitle>
          <CardDescription>Control operativo de productos y ventas.</CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryPosPanel />
        </CardContent>
      </Card>
    </DashboardSectionShell>
  )
}
