/**
 * GET/POST /api/sales — Punto de venta (POS)
 *
 * POST (registrar venta) es operación crítica:
 * - assertCsrf → evita ventas desde sitios externos
 * - requireRoles → solo admin/superadmin
 * - assertSameGym → producto y cliente del mismo gimnasio
 * - auditLog → trazabilidad financiera
 */
import { NextRequest, NextResponse } from 'next/server'
import { assertSameGym, handleAuthError, requireRoles, verifyAuth } from '@/lib/auth-server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/models/Product'
import Sale from '@/lib/models/Sale'
import User from '@/lib/models/User'
import { assertCsrf } from '@/lib/csrf'
import { auditLog } from '@/lib/audit-log'
import { recordActivitySafe } from '@/lib/activity-log/record'
import { buildPagination, parsePagination } from '@/lib/pagination'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const user = await verifyAuth(req)
    requireRoles(user, ['admin', 'superadmin'])

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = parsePagination(searchParams, 50)

    const filter = { gymId: user.gymId || null }

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('clientId', 'name email')
        .populate('adminId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Sale.countDocuments(filter),
    ])

    return NextResponse.json({
      sales,
      pagination: buildPagination(page, limit, total),
    })
  } catch (error) {
    const authError = handleAuthError(error)
    return NextResponse.json({ error: authError.message }, { status: authError.status })
  }
}

export async function POST(req: NextRequest) {
  try {
    assertCsrf(req)
    await connectDB()
    const user = await verifyAuth(req)
    requireRoles(user, ['admin', 'superadmin'])

    const body = await req.json()
    const { clientId, items, paymentMethod = 'cash' } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Debe incluir productos' }, { status: 400 })
    }

    if (clientId) {
      const client = await User.findById(clientId)
      if (!client || client.role !== 'client') {
        return NextResponse.json({ error: 'Cliente inválido' }, { status: 400 })
      }
      assertSameGym(user, client.gymId)
    }

    const normalizedItems = [] as Array<{
      productId: string
      quantity: number
      unitPrice: number
      subtotal: number
    }>
    let total = 0

    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product || !product.isActive) {
        return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
      }

      assertSameGym(user, product.gymId)

      const quantity = Number(item.quantity) || 0
      if (quantity < 1 || product.stock < quantity) {
        return NextResponse.json({ error: `Stock insuficiente para ${product.name}` }, { status: 400 })
      }

      const unitPrice = Number(item.unitPrice ?? product.price)
      const subtotal = unitPrice * quantity
      total += subtotal
      normalizedItems.push({ productId: product._id.toString(), quantity, unitPrice, subtotal })
    }

    for (const item of normalizedItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
    }

    const sale = await Sale.create({
      clientId: clientId || null,
      adminId: user._id,
      gymId: user.gymId || null,
      items: normalizedItems,
      total,
      paymentMethod,
    })

    auditLog('sale.create', {
      actorId: user._id.toString(),
      saleId: sale._id.toString(),
      total,
      gymId: user.gymId?.toString() || null,
    })

    recordActivitySafe({
      gymId: user.gymId,
      actorId: user._id,
      actorName: user.name,
      actorAvatar: user.avatar,
      action: 'sale.create',
      summary: `registró una venta por $${total.toFixed(2)}`,
      targetType: 'Sale',
      targetId: sale._id,
      metadata: { total, itemCount: normalizedItems.length },
    })

    return NextResponse.json({ sale }, { status: 201 })
  } catch (error) {
    const authError = handleAuthError(error)
    return NextResponse.json({ error: authError.message }, { status: authError.status })
  }
}
