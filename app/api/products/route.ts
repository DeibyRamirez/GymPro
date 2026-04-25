import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
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
    await verifyAuth(req);
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json({
      products: products.map((product) => ({
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        image: product.image,
        lowStock: product.stock <= product.lowStockThreshold,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear productos' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, category, price, stock, lowStockThreshold, image } = body;
    if (!name || !description || !category || price === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const product = await Product.create({
      name,
      description,
      category,
      price,
      stock,
      lowStockThreshold: lowStockThreshold ?? 5,
      image,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
