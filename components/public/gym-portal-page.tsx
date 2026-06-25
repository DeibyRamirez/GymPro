/* eslint-disable @next/next/no-img-element */
"use client"

import { Button as UIButton } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, UserPlus } from "lucide-react"
import Link from "next/link"
import { PortalAuthActions } from "./portal-auth-actions"
interface GymPortalPageProps {
  slug: string
  gym: {
    name: string
    slug: string
    location: string
    description?: string
    email: string
    phone?: string
    hours?: string
    logo?: string
    coverImage?: string
    gallery: string[]
    plans: Array<{ name: string; price?: number; description?: string; featured?: boolean }>
    machines: Array<{ name: string; image?: string; description?: string }>
    products: Array<{ name: string; price: number; image?: string; description?: string }>
  }
}

export function GymPortalPage({ slug, gym }: GymPortalPageProps) {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Portal público</p>
            <h1 className="text-2xl font-bold">{gym.name}</h1>
          </div>
          <div className="hidden gap-2 md:flex">
            <PortalAuthActions slug={slug} />
            <UIButton asChild size="sm">
              <Link href={`/portal/${slug}/register`}><UserPlus className="mr-2 h-4 w-4" /> Registro</Link>
            </UIButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 space-y-8 pb-24 md:pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Información del gimnasio</CardTitle>
            <CardDescription>{gym.description || 'Información general del portal.'}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-4">
            <p><strong>Horario:</strong> {gym.hours || 'No disponible'}</p>
            <p><strong>Ubicación:</strong> {gym.location}</p>
            <p><strong>Teléfono:</strong> {gym.phone || 'No disponible'}</p>
            <p><strong>Email:</strong> {gym.email}</p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>eCommerce</CardTitle>
              <CardDescription>Productos disponibles para este gimnasio.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {gym.products.map((product) => (
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
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Máquinas</CardTitle>
              <CardDescription>Equipamiento del gimnasio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {gym.machines.map((machine) => (
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

        <Card>
          <CardHeader>
            <CardTitle>Membresías</CardTitle>
            <CardDescription>Planes disponibles en este gimnasio.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {gym.plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-4 ${plan.featured ? 'border-primary bg-primary/5' : 'bg-card'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-xl font-bold">{typeof plan.price === 'number' ? `$${plan.price}` : 'Consultar'}</p>
                  </div>
                  {plan.featured ? <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">Recomendado</span> : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description || 'Acceso al gimnasio.'}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-3">
            <PortalAuthActions slug={slug} />
            <UIButton asChild>
              <Link href={`/portal/${slug}/register`}>Registro</Link>
            </UIButton>
          </div>
        </div>
      </section>
    </main>
  )
}
