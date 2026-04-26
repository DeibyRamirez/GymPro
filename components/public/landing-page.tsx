"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { platformFeatures } from "@/lib/saas-data"
import { Search, Shield, Sparkles, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type GymCard = {
  name: string
  slug: string
  location: string
  description?: string
  logo?: string
  coverImage?: string
  plans: Array<{ name: string }>
}

export function LandingPage() {
  const [query, setQuery] = useState("")
  const [gyms, setGyms] = useState<GymCard[]>([])

  useEffect(() => {
    const loadGyms = async () => {
      const response = await fetch(`/api/gyms?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setGyms(data.gyms || [])
      }
    }

    loadGyms()
  }, [query])

  const filteredGyms = useMemo(() => gyms, [gyms])

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="gap-2 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              SaaS para gimnasios con subdominios dinámicos
            </Badge>
            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tight text-balance sm:text-6xl">
                Gym Pro centraliza ventas, clientes y rendimiento en un solo sistema.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Una plataforma multi-tenant para operar cada gimnasio en su propio subdominio, con dashboards por rol, eCommerce, nutrición, rutinas y analíticas.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg">
                    Acceder <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem asChild><Link href="/login">SaaS Login</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/superadmin">Superadmin</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild variant="outline" size="lg">
                <Link href="/register">Registrarse</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Shield className="h-4 w-4" />Tenant isolation por gimnasio</span>
              <span>•</span>
              <span>Dashboard central tras login</span>
            </div>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Lo que incluye</CardTitle>
              <CardDescription>Módulos listos para escalar cada gimnasio.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {platformFeatures.slice(0, 4).map((feature) => (
                <div key={feature.title} className="rounded-lg border p-3">
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Directorio de gimnasios</h2>
            <p className="text-muted-foreground">Busca un gimnasio afiliado y entra a su subdominio.</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nombre, ciudad o plan" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredGyms.map((gym) => (
            <Card key={gym.slug} className="overflow-hidden">
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                <img src={gym.coverImage || gym.logo || '/placeholder.jpg'} alt={gym.name} className="h-full w-full object-cover" />
              </div>
              <CardHeader>
                <CardTitle>{gym.name}</CardTitle>
                <CardDescription>{gym.location}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{gym.description}</p>
                <div className="flex flex-wrap gap-2">
                  {gym.plans.map((plan) => <Badge key={plan.name} variant="secondary">{plan.name}</Badge>)}
                </div>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/portal/${gym.slug}/home`}>Ingresar</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 bg-transparent">
                    <Link href={`/portal/${gym.slug}/register`}>Registrarse</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {platformFeatures.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
