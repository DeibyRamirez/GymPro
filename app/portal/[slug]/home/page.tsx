/* eslint-disable @next/next/no-img-element */
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Gym from "@/lib/models/Gym"
import GymEquipment from "@/lib/models/GymEquipment"
import Product from "@/lib/models/Product"
import connectDB from "@/lib/mongodb"
import { Clock3, Dumbbell, LayoutDashboard, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

// Este es el componente de la página de inicio del portal público de un gimnasio específico, identificado por su slug.
type ProductCard = {
  name: string
  price: number
  image?: string
  description?: string
}

// Este componente muestra información general del gimnasio, como su nombre, descripción, horario, ubicación, 
// productos disponibles en su eCommerce y máquinas de entrenamiento. También proporciona enlaces para que los usuarios puedan acceder al dashboard o registrarse. 
// Si el gimnasio no se encuentra o está suspendido, muestra una página de "No encontrado".
type MachineCard = {
  name: string
  image?: string
  description?: string
}

type PlanCard = {
  name: string
  price?: number
  description?: string
  featured?: boolean
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  await connectDB()

  // Leemos el gimnasio directo desde Mongo para evitar que la UI dependa de un fetch interno.
  const gym = await Gym.findOne({ slug, status: { $ne: 'suspended' } })

  if (!gym) {
    notFound()
  }

  const products = await Product.find({ gymId: gym._id, isActive: true }).sort({ createdAt: -1 })
  const equipment = await GymEquipment.find({ gymId: gym._id, isActive: true }).sort({ createdAt: -1 })

  // Preparamos los datos del gimnasio para pasarlos a la UI, asegurándonos de manejar casos donde algunos campos puedan estar vacíos o no definidos.
  const gymData = {
    name: gym.name,
    slug: gym.slug,
    email: gym.email,
    phone: gym.phone,
    hours: gym.hours,
    location: gym.location,
    products: products.map((product) => ({
      name: product.name,
      price: product.price,
      image: product.images?.[0] || product.image || '/placeholder.jpg',
      description: product.description,
    })) as ProductCard[],
    machines: equipment.map((machine) => ({
      name: machine.name,
      image: machine.image || '/placeholder.jpg',
      description: machine.description,
    })) as MachineCard[],
    plans: gym.plans as PlanCard[],
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            {gym.logo && gym.logo !== "/placeholder-logo.svg" ? (
               
              <img src={gym.logo} alt={gymData.name} className="h-11 w-11 rounded-xl border object-cover" />
            ) : null}
            <div>
              <p className="text-sm text-muted-foreground">Portal público</p>
              <h1 className="text-2xl font-bold">{gymData.name}</h1>
            </div>
          </div>
          <div className="hidden gap-2 md:flex">
            <Button asChild size="sm" variant="outline"><Link href={`/portal/${gymData.slug}/login`}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></Button>
            <Button asChild size="sm"><Link href={`/portal/${gymData.slug}/register`}>Registrarme</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 space-y-8 pb-24 md:pb-8">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="grid gap-0 lg:grid-cols-2">
              <div className="relative min-h-72 bg-gradient-to-br from-primary/20 via-background to-accent/20 p-8">
                <Badge variant="secondary" className="mb-4 w-fit">Portal del gimnasio</Badge>
                <h2 className="max-w-md text-4xl font-black tracking-tight text-balance">{gymData.name}</h2>
                <p className="mt-4 max-w-lg text-sm text-muted-foreground">
                  {gym.description || 'Descubre los servicios, el catálogo y el equipamiento disponible en este gimnasio.'}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1"><Clock3 className="h-3 w-3" /> {gymData.hours || 'Horario no disponible'}</Badge>
                  <Badge variant="outline">{gymData.location}</Badge>
                </div>
              </div>
              <div className="relative min-h-72 bg-muted">
                <img src={gym.coverImage || gym.logo || '/placeholder.jpg'} alt={gymData.name} className="h-full w-full object-cover" />
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Acceso rápido</CardTitle>
              <CardDescription>Entra o registra una cuenta en este gym.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild size="lg" className="justify-start">
                <Link href={`/portal/${gymData.slug}/login`}><LayoutDashboard className="mr-2 h-4 w-4" /> Ir al dashboard</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="justify-start bg-transparent">
                <Link href={`/portal/${gymData.slug}/register`}>Crear cuenta</Link>
              </Button>
              <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Contacto</p>
                <p>{gymData.email}</p>
                <p>{gymData.phone || 'Sin teléfono'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> eCommerce</CardTitle>
              <CardDescription>Suplementos y accesorios disponibles en este gimnasio.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {gymData.products.length === 0 ? (
                <p className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Pronto encontrarás aquí proteínas, vitaminas y suplementos del gimnasio.
                </p>
              ) : (
                gymData.products.map((product: ProductCard) => (
                <div key={product.name} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="aspect-square bg-muted">
                    <img src={product.image || '/placeholder.jpg'} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold leading-tight">{product.name}</h3>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">${product.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  </div>
                  <div className="border-t p-4">
                    <Button asChild size="sm" variant="outline" className="w-full justify-center">
                      <Link href={`/portal/${gymData.slug}/store`}>Ver tienda</Link>
                    </Button>
                  </div>
                </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Dumbbell className="h-4 w-4" /> Máquinas</CardTitle>
              <CardDescription>Equipamiento y estaciones disponibles para entrenamiento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {gymData.machines.map((machine: MachineCard) => (
                <div key={machine.name} className="flex items-start gap-3 rounded-xl border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{machine.name}</p>
                    <p className="text-sm text-muted-foreground">{machine.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Badge variant="secondary">Planes</Badge> Membresías disponibles</CardTitle>
            <CardDescription>Elige la membresía que mejor se adapte a tu objetivo.</CardDescription>
          </CardHeader>
          {/* Si no hay planes disponibles, mostramos un mensaje indicando que no hay planes activos. */}
          {gymData.plans.length === 0 ? (
            <CardContent className="text-center text-muted-foreground">
              No hay planes activos en este momento.
            </CardContent>
          ) : (
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {gymData.plans.map((plan: PlanCard) => (
                <div key={plan.name} className={`rounded-2xl border p-4 ${plan.featured ? 'border-primary bg-primary/5' : 'bg-card'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-2xl font-black">{typeof plan.price === 'number' ? `$${plan.price}` : 'Precio a consultar'}</p>
                    </div>
                    {plan.featured ? <Badge>Recomendado</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description || 'Acceso a las instalaciones del gimnasio.'}</p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-3">
            <Button asChild variant="outline"><Link href={`/portal/${gymData.slug}/login`}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link></Button>
            <Button asChild><Link href={`/portal/${gymData.slug}/register`}>Registro</Link></Button>
          </div>
        </div>
      </section>
    </main>
  )
}
