import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Sale from '@/lib/models/Sale';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Token no proporcionado');
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');
  return user;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para ver ventas' }, { status: 403 });
    }

    const sales = await Sale.find({}).populate('clientId', 'name email').populate('adminId', 'name email').sort({ createdAt: -1 });
    return NextResponse.json({ sales });
  } catch {
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para registrar ventas' }, { status: 403 });
    }

    const body = await req.json();
    const { clientId, items, paymentMethod = 'cash' } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Debe incluir productos' }, { status: 400 });
    }

    if (clientId) {
      const client = await User.findById(clientId);
      if (!client || client.role !== 'client') {
        return NextResponse.json({ error: 'Cliente inválido' }, { status: 400 });
      }
    }

    const normalizedItems = [] as Array<{ productId: string; quantity: number; unitPrice: number; subtotal: number }>;
    let total = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 });
      const quantity = Number(item.quantity) || 0;
      if (quantity < 1 || product.stock < quantity) {
        return NextResponse.json({ error: `Stock insuficiente para ${product.name}` }, { status: 400 });
      }

      const unitPrice = Number(item.unitPrice ?? product.price);
      const subtotal = unitPrice * quantity;
      total += subtotal;
      normalizedItems.push({ productId: product._id.toString(), quantity, unitPrice, subtotal });
    }

    for (const item of normalizedItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }

    const sale = await Sale.create({
      clientId: clientId || null,
      adminId: user._id,
      items: normalizedItems,
      total,
      paymentMethod,
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al registrar venta' }, { status: 500 });
  }
}
