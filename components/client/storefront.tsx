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

export function Storefront() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/products', { credentials: 'include' })
        if (!res.ok) {
          throw new Error('No se pudieron cargar los productos')
        }

        const data = await res.json()
        setProducts(Array.isArray(data.products) ? data.products : [])
      } catch (loadError) {
        setProducts([])
        setError(loadError instanceof Error ? loadError.message : 'Error al cargar productos')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{error}</p>
  }

  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay productos disponibles en este gimnasio.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{product.name}</CardTitle>
              {product.lowStock && (
                <Badge variant="destructive" className="shrink-0">
                  <Flame className="mr-1 h-3 w-3" />
                  Bajo stock
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">${product.price.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
            </div>
            <Button size="sm" className="w-full" disabled={product.stock <= 0}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
