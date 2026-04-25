"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Plus } from "lucide-react"

type Product = { id: string; name: string; price: number; stock: number; lowStockThreshold: number; lowStock: boolean }
type User = { id: string; name: string; email: string }

export function InventoryPosPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<User[]>([])
  const [clientId, setClientId] = useState("")
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const lowStockProducts = products.filter((product) => product.lowStock)

  const load = async () => {
    const [pRes, cRes] = await Promise.all([
      fetch('/api/products', { credentials: 'include' }),
      fetch('/api/users?role=client', { credentials: 'include' })
    ])
    const pData = await pRes.json()
    const cData = await cRes.json()
    setProducts(pData.products || [])
    setClients(cData.users || [])
  }

  useEffect(() => { load() }, [])

  const handleSale = async () => {
    await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ clientId: clientId === 'none' ? undefined : clientId || undefined, items: [{ productId, quantity: Number(quantity) }] })
    })
    await load()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> POS Rápido</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin cliente</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
            <SelectContent>
              {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min={1} />
          <Button onClick={handleSale} disabled={!productId}>Cobrar</Button>
        </CardContent>
      </Card>

      <Card className={lowStockProducts.length ? "border-destructive/30" : ""}>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="font-medium">Alertas de stock</p>
            <p className="text-sm text-muted-foreground">{lowStockProducts.length} productos bajo el umbral mínimo</p>
          </div>
          <Badge className="bg-destructive/10 text-destructive"><AlertTriangle className="mr-1 h-3 w-3" /> {lowStockProducts.length}</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lowStockProducts.map((p) => (
          <Card key={p.id} className="border-destructive/30">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">Stock: {p.stock}</p>
              </div>
              <Badge className="bg-destructive/10 text-destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Bajo</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
