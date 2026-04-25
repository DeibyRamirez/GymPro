"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ShoppingCart, Flame } from "lucide-react"

type Product = {
  id: string
  name: string
  description: string
  category: string
  price: number
  stock: number
  lowStock: boolean
}

const seedProducts: Product[] = [
  {
    id: 'seed-1',
    name: 'Proteína Whey 2lb',
    description: 'Suplemento de proteína para recuperación y masa muscular',
    category: 'suplemento',
    price: 59.99,
    stock: 18,
    lowStock: false,
  },
  {
    id: 'seed-2',
    name: 'Shaker Gym Pro',
    description: 'Botella mezcladora resistente para batidos y agua',
    category: 'accesorio',
    price: 12.99,
    stock: 30,
    lowStock: false,
  },
  {
    id: 'seed-3',
    name: 'Bebida Isotónica',
    description: 'Bebida de hidratación para entrenamientos intensos',
    category: 'bebida',
    price: 3.5,
    stock: 48,
    lowStock: false,
  },
  {
    id: 'seed-4',
    name: 'Creatina Monohidratada',
    description: 'Apoyo para fuerza, volumen y rendimiento',
    category: 'suplemento',
    price: 24.99,
    stock: 4,
    lowStock: true,
  },
]

export function Storefront() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/products', { credentials: 'include' })
        const data = await res.json()
        setProducts((data.products && data.products.length > 0) ? data.products : seedProducts)
      } catch {
        setProducts(seedProducts)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Tienda Gym</h3>
          <p className="text-sm text-muted-foreground">Suplementos, accesorios y bebidas disponibles en sede</p>
        </div>
        <Badge variant="secondary" className="gap-1"><ShoppingCart className="h-3 w-3" /> Catálogo</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                {product.lowStock && <Badge className="bg-destructive/10 text-destructive">Stock bajo</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize">{product.category}</span>
                <span className="font-semibold">${product.price}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Disponibles</span>
                <span className="font-medium">{product.stock}</span>
              </div>
              <Button className="w-full" disabled>
                <Flame className="mr-2 h-4 w-4" />
                Ver en sede
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
